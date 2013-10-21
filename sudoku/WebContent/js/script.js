$(document).ready(function() {

  // Make h1 colourful
  $("h1, .siteLink").lettering();

  // Create arrays for each row, column and 3x3 square so we can easily find which elements are in each of these.
  var rowArray = initialiseRowArray();
  var colArray = initialiseColArray();
  var squareArray = initialiseSquareArray();
  
  // Create input elements for sudoku grid
  createGridInDOM([]);
  
  // Set up Clear Grid link
  $("#clearGrid").click(function() {
    clearGrid();
  });
  
  setupSudokuStringButton();

  // Populate grid with predefined sudoku if user picks one of them
  setupSudokuSelectorRadioButtons();
  
  // Initialise classesArray to keep track of how the elements are solved.
  var classesArray = [];
  for (var elem=0; elem<81; elem++) {
    classesArray[elem] = "";
  }
      
  // When solve button is clicked, solve sudoku
  $(".solveButton").click(function() {
  
    // Start timer
    var startTime = new Date;

    // Initialise sudoku array with possibilities.
    var gridArray = [];
    for (var elem=0; elem<81; elem++) {
      gridArray[elem] = [1,2,3,4,5,6,7,8,9];
    }
    
    // Take input values from grid and put into sudoku array
    for (var elem=0; elem<81; elem++) {
      var elemValue = $("#elem" + elem).attr("value");
      if (elemValue != "") {
        elemValue = parseFloat(elemValue);
        gridArray[elem] = elemValue;
      }
    };
    
    // Solve sudoku
    gridArray = solve(gridArray);

    // Stop timer
    var endTime = new Date;
    var timeTaken = endTime - startTime;
    if (timeTaken == 0) {
      timeTaken = "< 1";
    }

  // Display sudoku and if sukoku was solved/impossible/failed
    if (isSolved(gridArray)) {
      createGridInDOM(gridArray);
      $(this).parent(".buttonWrapper").siblings(".result").text("Solved in " + timeTaken + " ms!");
    } else {
      if (isValid(gridArray)) {
        $(this).parent(".buttonWrapper").siblings(".result").text("Failed!");
      } else {
        $(this).parent(".buttonWrapper").siblings(".result").text("Not possible!");
      }
    }

  }); // End solve button click


  function solve(gridArray) {
  
    // Check if solved
    if (isSolved(gridArray)) {
      return gridArray;
    }
    
    var gridChanged = true;
    var startingElementsSolved;
    var endingElementsSolved;
  
    // Apply sudoku rules 1 and 2 multiple times (until grid does not change)
    while (gridChanged && isValid(gridArray)) {
  
      gridChanged = false;
      startingElementsSolved = getNoOfElementsSolved(gridArray);
  
      gridArray = applyRules1And2(gridArray);    
      
      // If some elements have been solved by rules 1 and 2, we should repeat these rules
      endingElementsSolved = getNoOfElementsSolved(gridArray);
      if (startingElementsSolved != endingElementsSolved) {
        gridChanged = true;
      }
      
    };
    
    // When rules 1 and 2 can't solve any more elements, we move on to rule 3
    gridArray = applyRule3(gridArray);
  
    return gridArray;
  
  } // end solve
  
  
  function applyRules1And2(gridArray) {
  
    // Loop through each element. If it is an array (i.e. not yet solved), remove numbers from the possibility array which are not possible.
    // i.e. Remove numbers which are in the same row, column or 3x square as this element
    for (var elem=0; elem<81; elem++) {
      gridArray = applyRules1And2ToOneElement(gridArray, elem);
    }
    return gridArray;
  
  } // end applyRules1And2
  
  
  
  function applyRules1And2ToOneElement(gridArray, elem) {
  
    // Check element is an array (i.e. the element has not yet been solved)
    if (typeof gridArray[elem] == "object") {
    
      // Loop through other elements in the same row as this element. Rows are numbered 0 to 8
      var currentRow = getRow(elem);
      gridArray = solveElementUsingRules1And2('row', gridArray, currentRow, elem);
      
      // Loop through other elements in the same column as this element. Columns are numbered 0 to 8
      var currentCol = getCol(elem);
      gridArray = solveElementUsingRules1And2('col', gridArray, currentCol, elem);
  
      // Loop through other elements in the same column as this element. 3x3 squares are numbered 0 to 8
      var currentSquare = getSquare(elem);
      gridArray = solveElementUsingRules1And2('square', gridArray, currentSquare, elem);
  
    }
    
    return gridArray; 
  
  } // end applyRules1And2ToOneElement
  
  
  
  function solveElementUsingRules1And2(rowColOrSquare, gridArray, currentRowColOrSquare, elem) {
  
    // Find out if we are comparing the current element (elem) with the other elements in a row, column or square
    switch (rowColOrSquare) {
      case 'row':
        var elementsToCompare = rowArray[currentRowColOrSquare];
        break;
      case 'col':
        var elementsToCompare = colArray[currentRowColOrSquare];
        break;
      case 'square':
        var elementsToCompare = squareArray[currentRowColOrSquare];
        break;
    }
  
    // Rule 1: Compare the current element (elem) with the other elements in a row, column or square
    for (var box=0; box<9; box++) {
  
      var otherElem = elementsToCompare[box];
      // Don't use the current element in the comparison
      if (otherElem != elem) {
  
        // If the other element is a number, remove it as a possibility from the current element's array
        if (typeof gridArray[otherElem] == "number") {
          if (isAPossibility(gridArray[elem], gridArray[otherElem])) {
            gridArray[elem] = removePossibility(gridArray[elem], gridArray[otherElem]);
            if (typeof gridArray[elem] == "number") {
              classesArray[elem] = "solved1";
//              $("#elem" + elem).attr("value", gridArray[elem]).addClass("solved1");
            }
          }
        }
        
      }
    }
  
    // Rule 2: Check all the possibilities for this element to see if it is the only one in a row, column or square that can have this possibility
    for (var poss=0; poss<gridArray[elem].length; poss++) {
    
      var currentPossNumber = gridArray[elem][poss];
      var currentPossFoundInOtherElem = false;
      for (var box=0; box<9; box++) {
      
        var otherElem = elementsToCompare[box];
        // Don't use the current element in the comparison
        if (otherElem != elem) {
        
          // If the other element is an array, check to see if the current possible correct number for elem is in the other element's array.
          if (typeof gridArray[otherElem] == "object") {          
            if (isAPossibility(gridArray[otherElem], currentPossNumber)) {
              currentPossFoundInOtherElem = true;
            }          
          }
    
        }
      }
      
      // If the possible number cannot possibly go anywhere else in its row, column or square, it must go in this element.
      if (!currentPossFoundInOtherElem) {
        gridArray[elem] = currentPossNumber;
        classesArray[elem] = "solved2";
//        $("#elem" + elem).attr("value", currentPossNumber).addClass("solved2");
      }
    }  
  
    return gridArray;
    
  } // end solveElementUsingRules1And2
  
  
  
  function applyRule3(gridArray) {
  
    // Find first non solved element with the minimum possibilities
    if (!isSolved(gridArray) && isValid(gridArray)) {
  
      // Find a good element to guess the value of - one with the least possibilities
      var nonSolvedElem = findElementWithLeastPossibilities(gridArray);
      var noOfPossibilities = gridArray[nonSolvedElem].length;
  
      // Take a copy of gridArray as it currently stands
      var origGridArray = $.extend(true, [], gridArray);
  
      // Try to solve the sudoku using one of the possibilities of the nonSolvedElem element.
      // If that doesn't work, we use the next possibility of this element.
      for (var poss=0; poss<noOfPossibilities; poss++) {
  
        // If the sudoku hasn't been solved
        if (!isSolved(gridArray)) {
  
          // If the sudoku is invalid, the last guess was wrong.
          // Reset gridArray and input element
          if (!isValid(gridArray)) {
            gridArray = $.extend(true, [], origGridArray);
          }
          
          // Try the next (or first) possibility in the element
          var currentPoss = gridArray[nonSolvedElem][poss];
          gridArray[nonSolvedElem] = gridArray[nonSolvedElem][poss];
  
          // Update the displayed grid by setting the element's value using jquery
          classesArray[nonSolvedElem] = "guessed";
//          $("#elem" + nonSolvedElem).attr("value", gridArray[nonSolvedElem]).addClass("guessed");
          
          // Try to solve the sudoku again by calling the solve function recursively
          gridArray = solve(gridArray);
  
        }
      }
    }
    
    return gridArray;
  
  } // end applyRule3
  
  
  
  function findElementWithLeastPossibilities(gridArray) {
  
    var nonSolvedElem = "";
    var noOfPossibilities = 10; // one more than possible so that the first element with possibilities will be looked at
    for (var elem=0; elem<81; elem++) {
  
      // Check element is an array (i.e. the element has not yet been solved)
      if (typeof gridArray[elem] == "object") {
        if (gridArray[elem].length < noOfPossibilities) {
          nonSolvedElem = elem;
          noOfPossibilities = gridArray[elem].length;
        }
      }
    }
    
    return nonSolvedElem;
      
  } // end findElementWithLeastPossibilities
  
  
  function getNoOfElementsSolved(gridArray) {
  
    // Find the number of elements in the grid that have been solved
    var elementsSolved = 0;
    for (var elem=0; elem<81; elem++) {
      if (typeof gridArray[elem] == "number") {
        elementsSolved++;
      }
    }
    return elementsSolved;
  
  } // end getNoOfElementsSolved
  
  
  function isSolved(gridArray) {
  
    // First check that all elements in the grid are numbers, not possibility arrays
    for (var elem=0; elem<81; elem++) {
      if (typeof gridArray[elem] != "number") return false;   
    }
  
    // Loop through each row to check total is 45
    var rowTotal;
    for (var row=0; row<9; row++) {
      rowTotal = 0;
      for (var elem=0; elem<9; elem++) {
        rowTotal += gridArray[rowArray[row][elem]];
      }
      if (rowTotal != 45) {
        return false;
      }
    }
  
    // Loop through each column to check total is 45
    var colTotal;
    for (var col=0; col<9; col++) {
      colTotal = 0;
      for (var elem=0; elem<9; elem++) {
        colTotal += gridArray[colArray[col][elem]];
      }
      if (colTotal != 45) {
        return false;
      }
    }
    
    // Loop through each 3x3 square to check total is 45
    var squareTotal;
    for (var square=0; square<9; square++) {
      squareTotal = 0;
      for (var elem=0; elem<9; elem++) {
        squareTotal += gridArray[squareArray[square][elem]];
      }
      if (squareTotal != 45) {
        return false;
      }
    }
  
    // If all tests pass, the grid is solved
    return true;
  
  } // end isSolved
  
  
  function isValid(gridArray) {
  
    // Loop through each row. Check each number only occurs once in the row.
    for (var row=0; row<9; row++) {
      var numbersInRow = [];
      for (var elem=0; elem<9; elem++) {
  
        // If element is a number, check if this number is already in the row array. If it is, the grid is invalid.
        // If not, we add the number to the row array.
        var currentElem = gridArray[rowArray[row][elem]];
        if (typeof currentElem == "number") {
          if (numbersInRow.indexOf(currentElem) > -1) {
            return false;
          } else {
            numbersInRow.push(currentElem);
          }        
        }
      }
    }
  
    // Loop through each row. Check each number only occurs once in the row.
    for (var col=0; col<9; col++) {
      var numbersInCol = [];
      for (var elem=0; elem<9; elem++) {
  
        // If element is a number, check if this number is already in the column array. If it is, the grid is invalid.
        // If not, we add the number to the column array.
        var currentElem = gridArray[colArray[col][elem]];
        if (typeof currentElem == "number") {
          if (numbersInCol.indexOf(currentElem) > -1) {
            return false;
          } else {
            numbersInCol.push(currentElem);
          }        
        }
      }
    }
  
    // Loop through each square. Check each number only occurs once in the square.
    for (var square=0; square<9; square++) {
      var numbersInSquare = [];
      for (var elem=0; elem<9; elem++) {
  
        // If element is a number, check if this number is already in the column array. If it is, the grid is invalid.
        // If not, we add the number to the column array.
        var currentElem = gridArray[squareArray[square][elem]];
        if (typeof currentElem == "number") {
          if (numbersInSquare.indexOf(currentElem) > -1) {
            return false;
          } else {
            numbersInSquare.push(currentElem);
          }        
        }
      }
    }
    
    return true;
    
  } // end isValid
  
  
  function removePossibility(gridArrayElement, numberToRemove) {
  
    // Find the array index of the number to remove
    var elementPosition = gridArrayElement.indexOf(numberToRemove);
    // Remove it if found
    if (elementPosition != -1) {
      gridArrayElement.splice(elementPosition, 1);
    }
    if (gridArrayElement.length > 1) {
      return gridArrayElement;
    } else {
      return gridArrayElement[0];
    }
  
  } // removePossibility
  
  
  function isAPossibility(gridArrayElement, numberToCheck) {
  
    if (typeof gridArrayElement == "object") {
      var elementPosition = gridArrayElement.indexOf(numberToCheck);
      if (elementPosition == -1) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
    
  } // end isAPossibility
  
  
  function clearGrid() {
  
    // Clears all the input elements
    for (var elem=0; elem<81; elem++) {
      $("#elem" + elem).attr("value","").removeClass("solved1 solved2 guessed");
      classesArray[elem] = "";
    }
  
  } // end clearGrid
  
  
  function initialiseRowArray() {
  
    var rowArray = [];
    for (var row=0; row<9; row++) {
      var tempRowArray = [];
      for (elem=(row)*9; elem<(row+1)*9; elem++) {
        tempRowArray.push(elem);
      }
      rowArray[row] = tempRowArray;
    }
    return rowArray;
    
  } // end initialiseRowArray
  
  
  function initialiseColArray() {
  
    var colArray = [];
    for (var col=0; col<9; col++) {
      var tempColArray = [];
      for (elem=col; elem<73+col; elem=elem+9) {
        tempColArray.push(elem);
      }
      colArray[col] = tempColArray;
    }
    return colArray;
    
  } // end initialiseColArray
  
  
  function initialiseSquareArray() {
  
    var squareArray = [];
    for (var square=0; square<9; square++) {
      squareArray[square] = [];
    }
    for (var elem=0; elem<81; elem++) {
      var currentSquare = getSquare(elem);
      squareArray[currentSquare].push(elem);
    }
    return squareArray;
    
  } // end initialiseSquareArray
  
  
  function getRow(element) {
    return Math.floor (element / 9);
  } // end getRow
  
  
  function getCol(element) {
    return Math.floor(element % 9);
  } // end getCol
  
  
  function getSquare(element) {
  
    var row = getRow(element);
    var column = getCol(element);
    
    if (row < 3 && column < 3) return 0;
    if (row < 3 && column >= 3 && column < 6) return 1;
    if (row < 3 && column >= 6) return 2;
    if (row >= 3 && row < 6 && column < 3) return 3;
    if (row >= 3 && row < 6 && column >= 3 && column < 6) return 4;
    if (row >= 3 && row < 6 && column >= 6) return 5;
    if (row >= 6 && column < 3) return 6;
    if (row >= 6 && column >= 3 && column < 6) return 7;
    if (row >= 6 && column >= 6) return 8;
  
  } // end getSquare
  
  
  function dumpGrid(gridArray) {
  
    // Debugging function
    for (var elem=0; elem<81; elem++) {
      console.log(elem + " = " + gridArray[elem]);
    };
    
  } // end dumpGrid
  
  
  function setupSudokuStringButton() {
  
    // If a sudoku string is pasted in, then clear the grid and populate the sudoku with these numbers.
    // The string should contain 81 characters and have zeros, full stops or spaces for the blanks.
    // e.g. ...3..8..64.8...5.875.....15...7.2.6....9....2.9.8...54.....769.2...8.13..7..5...
    // or   000300800640800050875000001500070206000090000209080005400000769020008013007005000
    // or  "   3  8  64 8   5 875     15   7 2 6    9    2 9 8   54     769 2   8 13  7  5   "
  
    $("#addSudokuStringButton").click(function() {
    
    clearGrid();
    $("#gridSelector input:checked").attr("checked","");
      var sudokuString = $("#sudokuString").attr("value");
      populateGridWithSudokuString(sudokuString);  
    });
    
  } // end setupSudokuStringButton
  
  
  function populateGridWithSudokuString(sudokuString) {
  
    // Loop through each character and if it is a number add it into the grid
    for (var elem=0; elem<sudokuString.length; elem++) {
      if (sudokuString[elem] >= "1" && sudokuString[elem] <="9") {
        $("#elem" + elem).attr("value",sudokuString[elem]);
      }
    }
  
  } // end populateGridWithSudokuString
  
  
  function createGridInDOM(gridArray) {
  
    // Create input elements for sudoku grid
    var inputsHTML = "";
    var elem = 0;
    for (var row=0; row<9; row++) {
      inputsHTML += '<fieldset class="row">\n';
      for (var col=0; col<9; col++) {
        if (gridArray.length == 81) {
//          inputsHTML += '<input id="elem' + ((row*9)+col)  + '" class="row' + row + ' col' + col + '" type="text" maxlength="1" value="' + gridArray[elem] + '">';
          inputsHTML += '<input id="elem' + ((row*9)+col)  + '" class="' + classesArray[elem] + ' row' + row + ' col' + col + '" type="text" maxlength="1" value="' + gridArray[elem] + '">';
        } else {
          inputsHTML += '<input id="elem' + ((row*9)+col)  + '" class="row' + row + ' col' + col + '" type="text" maxlength="1">';
        }
        elem++;
      }
      inputsHTML += '</fieldset>\n';
    }
    $("#grid").html(inputsHTML);
    
  } // end createGridInDOM


  function setupSudokuSelectorRadioButtons() {

    $("#gridSelector input").change(function() {
      if ($(this).is(":checked")) {
        var id = $(this).attr("id");
        clearGrid();
        switch (id) {
          case 'grid1':
            populateGridWithSudokuString("001003700000501000436000019070060802800209004502010060240000983000907000009800200");
            break;
          case 'grid2':
            populateGridWithSudokuString("000001000080090460901030058058603004203080507400502680190060802024050030000100000");
            break;
          case 'grid3':
            populateGridWithSudokuString("600000010000010200300000005003090006004625900900070500700000004002030000010000007");
            break;
          case 'grid4':
            populateGridWithSudokuString("100000400000008003005002619050046000004080700000730040396800500400900000008000001");
            break;
          case 'grid5':
            populateGridWithSudokuString("000000010400000000020000000000050604008000300001090000300400200050100000000807000");
            break;
        }
      }
    });
  } // end setupSudokuSelectorRadioButtons
  
  
});

