class CalculationError extends Error {
  constructor(message, variable = "") {
    super(message)
    this.variable = variable
  }
}

class Calculation {


  constructor() {}

  /**
   *  list of Variables 
   */
  static Variables = {}

  /**
   * create new variable after check it is valid  
   * 
   * @param {string} key 
   * @param {string} value 
   */
  static setVar(key, value) {

    key = key.trim()
    this.isValidationVar(key)
    this.Variables[key] = value
  }

  /**
   * get the variable value if exist if not send error
   * 
   * @param {string} key 
   * @returns variables value
   */
  static getVar(key) {
    if (!this.isVarExist(key))
      throw new CalculationError(`The Variable ${key} is not exist`, key)

    return this.Variables[key]
  }

  /**
   * check if variable exist or not
   * @param {string} key 
   * @returns if exist return true else return false
   */
  static isVarExist(key) {
    if (this.Variables[key])
      return true

    return false;
  }

  /**
   * check if variable name is valid else send error 
   * The variable must start with [a-zA-Z_]
   * @param {string} key 
   */
  static isValidationVar(key) {
    if (!/^[a-zA-Z_]\w*$/.test(key))
      throw new CalculationError("The Variable is not valid", key)
  }

  /**
   * Receive operation by string and process it
   * it start with parentheses then (*,/) then(+,-)
   * @param {string} operation 
   * @returns 
   */
  async process(operation) {

    if (/^(\s*)?(\d+|\d+\.\d+)(\s*)?$/.test(operation))
      return operation

    this.isOperationValid(operation)

    operation = operation.replace(/[a-zA-Z_]\w*/g, (match) => {
      this.constructor.isVarExist(match)
      return this.constructor.getVar(match)
    })
    operation = operation.replace(/(\d+|\d+\.\d+)(\()/g, (match, number, parentheses) => `${number}*${parentheses}`)
    operation = operation.replace(/\s+/g, '')


    let result = await this.highPrecedence(operation)
    this.isOperationHaveParentheses(result)

    result = await this.mediumPrecedence(result)
    result = this.lowestPrecedence(result)

    return this.calcSingOfNumber(result.trim())

  }

  /**
   * Validation of the process as there are no additions 
   * that have nothing to do with arithmetic or wrong variables
   * @param {*} operation 
   */
  isOperationValid(operation) {
    if (/([^a-zA-Z_\s\+\-\*\/\(\)]+[a-zA-Z_]+)|[^a-zA-Z_\s\+\-\*\/\(\)\d\.]/.test(operation))
      throw new CalculationError("There are some incorrect expressions")

    if (/(\d+(\.\d+)?)\s+(\d+(\.\d+)?)|(\d+(\.\d+)?)\s+\(|\)(\s+)?(\d+(\.\d+)?)/.test(operation))
      throw new CalculationError("The types of arithmetic operation between numbers are not defined")

    if (/(\d+(\.\d+)?)\s+([a-zA-Z_]\w*)|([a-zA-Z_]\w*)\s+(\d+(\.\d+)?|\()|\)(\s+)?([a-zA-Z_]\w*)|([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)/.test(operation))
      throw new CalculationError("The types of arithmetic operation between variables are not defined")

    if (/((\w+|\d+(\.\d+))[\-\+\*\/]+)(?!(\s+)?(\()?((\-|\+)+)?(\w+|\d+(\.\d)+))|^(\s+)?([\*\/]+\w+)/.test(operation))
      throw new CalculationError("One side of the calculation is selected")
  }

  /**
   * Check the order of the Parentheses
   * @param {String} operation 
   */
  isOperationHaveParentheses(operation) {
    if (/\(+|\)+/.test(operation))
      throw new CalculationError("The arithmetic operation is wrong, must be check the order of the parentheses")
  }

  /**
   * Returns the result of operations inside parentheses as text
   * اظ@param {string} operation 
   * @returns 
   */
  async highPrecedence(operation) {

    let match = operation.match(/(\(((((\+|\-)+)?(\d+|\d+\.\d+))(((\+|\-)+|(\*|\/)))?)+(\d+|\d+\.\d+)?\))/);

    if (!match)
      return operation

    let insideOperation = match[0].match(/(?!\().+(?=\))/g)[0]

    let result = await this.highPrecedence(insideOperation)
    result = await this.mediumPrecedence(result)
    result = this.lowestPrecedence(result)
    operation = this.resultReplace(operation, result, match.index, match[0].length)

    return this.highPrecedence(operation)

  }


  /**
   * Returns the result of multiplication and division operations inside a text as text
   * 
   * @param {string} operation 
   * @returns 
   */
  mediumPrecedence(operation) {

    let result
    let match;

    match = operation.match(/((\-)?\d+(\.\d+)?)(\s+)?(\*|\/)(\s+)?(((\-|\+)+)?(\s+)?)(\d+(\.\d+)?)/);

    if (!match)
      return operation

    let [number1, type, number2] = match[0].match(/((\d+(\.\d+)?)(\s+)?(?=(\*|\/)))|(\*|\/){1,}(\s+)?|(((\-|\+)+)?(\d+(\.\d+)?))\s?/g)

    number2 = this.calcSingOfNumber(number2)

    switch (type.trim()) {
      case "*":
        result = +number1 * +number2
        break;
      case "/":
        if (+number2 == 0)
          throw new CalculationError("Division by zero is undefined")
        result = +number1 / +number2
        break
    }

    operation = this.resultReplace(operation, result, match.index, match[0].length)

    return this.mediumPrecedence(operation)
  }

  /**
   * Returns the result of addition and subtraction operations inside the text as text
   *
   *   
   * @param {string} operation 
   * @returns {string} string
   */
  lowestPrecedence(operation) {

    let result
    let match;

    match = operation.match(/(((\-|\+)+)?\d+(\.\d+)?)(\s+)?(\+|\-)+(\s+)?(\d+(\.\d+)?)/)

    if (!match)
      return operation


    let [number1, type, number2] = match[0].match(/((((\-|\+)+)?\d+(\.\d+)?)\s?(?=(\-|\+)))|(\-|\+){1,}\s?|(\d+(\.\d+)?)\s?/g)
    type = this.calcSign(type)
    number1 = this.calcSingOfNumber(number1)

    switch (type.trim()) {
      case "+":
        result = +number1 + +number2
        break;
      case "-":
        result = +number1 - +number2
        break
    }

    operation = this.resultReplace(operation, result, match.index, match[0].length)

    return this.lowestPrecedence(operation)
  }

  /**
   *  Calculate the sign if there is more than one sign 
   * 
   *  param: sign String of one or more + or -
   * 
   * @param {String} sign 
   * @returns {String} real sign as string
   */
  calcSign(sign) {

    if (sign.length < 2)
      return sign

    return sign.split("")
      .reduce((pre, cur) => (+`${pre}1` * +`${cur}1`) > 0 ? "+" : "-")
  }

  /**
   *  Calculate the sign of the number if there is more than one sign 
   *  
   *  params : number has multi signs + or -
   * 
   * @param {String} number  
   * @returns the number with real sign as string
   */
  calcSingOfNumber(number) {

    let calc = number.match(/(\d+(\.\d+)?)|(\-|\+)+/g)

    if (!calc) return

    if (calc.length != 1)
      calc[0] = this.calcSign(calc[0])

    return calc.join("")

  }

  /**
   * replace the result from operation in the place it in the original text 
   * 
   * @param {String} original operation 
   * @param {String} result from operation
   * @param {Number} start position of the operation in the original text
   * @param {Number} length of the operation text into the original text
   * 
   * @returns {String} original string with replace the old operation by result 
   */
  resultReplace(original, result, start, length) {

    let firstText = (start == 0) ? "" : original.substring(0, start)

    let lastText = original.substring(length + start)

    return firstText + result + lastText
  }

}


// exports.Calculation = Calculation
// exports.CalculationError = CalculationError
const SelectEl = el => document.querySelector(el)

// elements
const result_ele = SelectEl(`.result__calculation`),

  calculationInput = SelectEl("#calculation"),
  variableInput = SelectEl("#variable"),
  descInput = SelectEl("#note"),

  errorCalc = SelectEl(".message__input__calculation"),
  errorVar = SelectEl(".message__variable"),


  listHistory = SelectEl(".history .list__history"),
  emptyHistory = SelectEl(".empty__history"),
  templateHistoryItem = SelectEl("#item__history__template").content

// 
const calc = new Calculation()


// has all calculation saved in app
const historyLists = {}

let currentid,
  currentResult = "0",
  variableExist = false

// whe dom loaded 
document.addEventListener("DOMContentLoaded", app)

function app() {

  // calculation process
  calculationInput.addEventListener("input", calculation_process)

  // input variable name 
  variableInput.addEventListener("input", variable_process)

  // open history section in sm screen 
  SelectEl(".calculator .show-history-mb").addEventListener("click", () => document.querySelector(".history").classList.add("open__history"))

  // close history section in sm screen 
  SelectEl(".history .close-history-mb").addEventListener("click", () => document.querySelector(".history").classList.remove("open__history"))

  //  save calculation
  SelectEl(".calculator .btn__save").addEventListener("click", registerItem)

  // clean all input element
  SelectEl(".btn__clean").addEventListener("click", resetFrom)


}




// ---- start calculation process

let setTimeInputCalculation

function calculation_process({
  target
}) {


  const value = target.value

  errorCalc.textContent = ""
  clearTimeout(setTimeInputCalculation)


  setTimeInputCalculation = setTimeout(async () => {
    try {

      let result = await calc.process(value)

      let key = variableInput.value
      if (key) Calculation.setVar(key, result)

      result_ele.textContent = currentResult = result || '0'

    } catch (error) {

      errorCalc.textContent = error.message

    }
  }, 1200)
}

let setTimeInputVariable

function variable_process({
  target
}) {

  let key = target.value

  if (!key) return

  clearTimeout(setTimeInputVariable)

  setTimeInputVariable = setTimeout(() => {


    errorVar.textContent = ""

    try {

      if (Calculation.isVarExist(key))
        throw new Error("The variable exists, try another one")

      Calculation.setVar(key, currentResult)
      variableExist = false
      currentid = null

    } catch (error) {
      variableExist = true
      errorVar.textContent = error.message
    }
  }, 1200)
}

//  Register a new item in history
function registerItem() {

  currentid = currentid || Math.ceil(Math.random() * 100) + Date.now()


  historyLists[currentid] = {
    result: currentResult ?? "0",
    calc: calculationInput.value ?? "0",
    desc: descInput.value ?? "",
    variable: variableInput.value ?? ""
  }

  createHistoryItem(historyLists[currentid], currentid)
}

// create new item in history
function createHistoryItem(data, id) {

  if (calculationInput.value.trim() === "" || variableExist) return

  if (emptyHistory.classList.contains("show__empty__history"))
    emptyHistory.classList.remove("show__empty__history")

  const currentLi = SelectEl(`li[data-id="${id}"]`)

  let liClone

  if (currentLi) {
    liClone = currentLi
  } else {

    liClone = templateHistoryItem.cloneNode(true)
    // add attribute
    liClone.querySelector("li").dataset.id = id

    // set event
    // edit calc
    liClone.querySelector(".btn__edit").addEventListener("click", editCalc)
    // delete calc
    liClone.querySelector(".btn__del").addEventListener("click", deleteCalc)
  }

  // add data
  liClone.querySelector(".variable__item").textContent = data.variable + " = "
  liClone.querySelector(".result__item").textContent = data.result
  liClone.querySelector(".note__item__history").textContent = data.desc


  listHistory.prepend(liClone)
  resetFrom()

}

// edit calc item by id
function editCalc({ target }) {
  const el = target.closest(".item__history")
  currentid = el.dataset.id

  initFrom(historyLists[currentid])

}

// delete calc item in history list by id 
function deleteCalc({ target }) {
  const el = target.closest(".item__history")
  id = el.dataset.id

  delete historyLists[id]
  el.remove()

  if (Object.keys(historyLists).length < 1)
    emptyHistory.classList.add("show__empty__history")

  resetFrom()
}

// clean all from input element
function initFrom(data = {}) {

  calculationInput.value = data.calc ?? ""
  variableInput.value = data.variable ?? ""
  descInput.value = data.desc ?? ""
  errorCalc.textContent = data.calcErr ?? ""
  errorVar.textContent = data.varErr ?? ""
  result_ele.textContent = data.result ?? "0"

}

// clean all from input element
function resetFrom() {
  initFrom()
  currentid = null
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhbGN1bGF0aW9uLmpzIiwibWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIENhbGN1bGF0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIHZhcmlhYmxlID0gXCJcIikge1xuICAgIHN1cGVyKG1lc3NhZ2UpXG4gICAgdGhpcy52YXJpYWJsZSA9IHZhcmlhYmxlXG4gIH1cbn1cblxuY2xhc3MgQ2FsY3VsYXRpb24ge1xuXG5cbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8qKlxuICAgKiAgbGlzdCBvZiBWYXJpYWJsZXMgXG4gICAqL1xuICBzdGF0aWMgVmFyaWFibGVzID0ge31cblxuICAvKipcbiAgICogY3JlYXRlIG5ldyB2YXJpYWJsZSBhZnRlciBjaGVjayBpdCBpcyB2YWxpZCAgXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgXG4gICAqL1xuICBzdGF0aWMgc2V0VmFyKGtleSwgdmFsdWUpIHtcblxuICAgIGtleSA9IGtleS50cmltKClcbiAgICB0aGlzLmlzVmFsaWRhdGlvblZhcihrZXkpXG4gICAgdGhpcy5WYXJpYWJsZXNba2V5XSA9IHZhbHVlXG4gIH1cblxuICAvKipcbiAgICogZ2V0IHRoZSB2YXJpYWJsZSB2YWx1ZSBpZiBleGlzdCBpZiBub3Qgc2VuZCBlcnJvclxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBcbiAgICogQHJldHVybnMgdmFyaWFibGVzIHZhbHVlXG4gICAqL1xuICBzdGF0aWMgZ2V0VmFyKGtleSkge1xuICAgIGlmICghdGhpcy5pc1ZhckV4aXN0KGtleSkpXG4gICAgICB0aHJvdyBuZXcgQ2FsY3VsYXRpb25FcnJvcihgVGhlIFZhcmlhYmxlICR7a2V5fSBpcyBub3QgZXhpc3RgLCBrZXkpXG5cbiAgICByZXR1cm4gdGhpcy5WYXJpYWJsZXNba2V5XVxuICB9XG5cbiAgLyoqXG4gICAqIGNoZWNrIGlmIHZhcmlhYmxlIGV4aXN0IG9yIG5vdFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFxuICAgKiBAcmV0dXJucyBpZiBleGlzdCByZXR1cm4gdHJ1ZSBlbHNlIHJldHVybiBmYWxzZVxuICAgKi9cbiAgc3RhdGljIGlzVmFyRXhpc3Qoa2V5KSB7XG4gICAgaWYgKHRoaXMuVmFyaWFibGVzW2tleV0pXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIGNoZWNrIGlmIHZhcmlhYmxlIG5hbWUgaXMgdmFsaWQgZWxzZSBzZW5kIGVycm9yIFxuICAgKiBUaGUgdmFyaWFibGUgbXVzdCBzdGFydCB3aXRoIFthLXpBLVpfXVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFxuICAgKi9cbiAgc3RhdGljIGlzVmFsaWRhdGlvblZhcihrZXkpIHtcbiAgICBpZiAoIS9eW2EtekEtWl9dXFx3KiQvLnRlc3Qoa2V5KSlcbiAgICAgIHRocm93IG5ldyBDYWxjdWxhdGlvbkVycm9yKFwiVGhlIFZhcmlhYmxlIGlzIG5vdCB2YWxpZFwiLCBrZXkpXG4gIH1cblxuICAvKipcbiAgICogUmVjZWl2ZSBvcGVyYXRpb24gYnkgc3RyaW5nIGFuZCBwcm9jZXNzIGl0XG4gICAqIGl0IHN0YXJ0IHdpdGggcGFyZW50aGVzZXMgdGhlbiAoKiwvKSB0aGVuKCssLSlcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wZXJhdGlvbiBcbiAgICogQHJldHVybnMgXG4gICAqL1xuICBhc3luYyBwcm9jZXNzKG9wZXJhdGlvbikge1xuXG4gICAgaWYgKC9eKFxccyopPyhcXGQrfFxcZCtcXC5cXGQrKShcXHMqKT8kLy50ZXN0KG9wZXJhdGlvbikpXG4gICAgICByZXR1cm4gb3BlcmF0aW9uXG5cbiAgICB0aGlzLmlzT3BlcmF0aW9uVmFsaWQob3BlcmF0aW9uKVxuXG4gICAgb3BlcmF0aW9uID0gb3BlcmF0aW9uLnJlcGxhY2UoL1thLXpBLVpfXVxcdyovZywgKG1hdGNoKSA9PiB7XG4gICAgICB0aGlzLmNvbnN0cnVjdG9yLmlzVmFyRXhpc3QobWF0Y2gpXG4gICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXRWYXIobWF0Y2gpXG4gICAgfSlcbiAgICBvcGVyYXRpb24gPSBvcGVyYXRpb24ucmVwbGFjZSgvKFxcZCt8XFxkK1xcLlxcZCspKFxcKCkvZywgKG1hdGNoLCBudW1iZXIsIHBhcmVudGhlc2VzKSA9PiBgJHtudW1iZXJ9KiR7cGFyZW50aGVzZXN9YClcbiAgICBvcGVyYXRpb24gPSBvcGVyYXRpb24ucmVwbGFjZSgvXFxzKy9nLCAnJylcblxuXG4gICAgbGV0IHJlc3VsdCA9IGF3YWl0IHRoaXMuaGlnaFByZWNlZGVuY2Uob3BlcmF0aW9uKVxuICAgIHRoaXMuaXNPcGVyYXRpb25IYXZlUGFyZW50aGVzZXMocmVzdWx0KVxuXG4gICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5tZWRpdW1QcmVjZWRlbmNlKHJlc3VsdClcbiAgICByZXN1bHQgPSB0aGlzLmxvd2VzdFByZWNlZGVuY2UocmVzdWx0KVxuXG4gICAgcmV0dXJuIHRoaXMuY2FsY1NpbmdPZk51bWJlcihyZXN1bHQudHJpbSgpKVxuXG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGlvbiBvZiB0aGUgcHJvY2VzcyBhcyB0aGVyZSBhcmUgbm8gYWRkaXRpb25zIFxuICAgKiB0aGF0IGhhdmUgbm90aGluZyB0byBkbyB3aXRoIGFyaXRobWV0aWMgb3Igd3JvbmcgdmFyaWFibGVzXG4gICAqIEBwYXJhbSB7Kn0gb3BlcmF0aW9uIFxuICAgKi9cbiAgaXNPcGVyYXRpb25WYWxpZChvcGVyYXRpb24pIHtcbiAgICBpZiAoLyhbXmEtekEtWl9cXHNcXCtcXC1cXCpcXC9cXChcXCldK1thLXpBLVpfXSspfFteYS16QS1aX1xcc1xcK1xcLVxcKlxcL1xcKFxcKVxcZFxcLl0vLnRlc3Qob3BlcmF0aW9uKSlcbiAgICAgIHRocm93IG5ldyBDYWxjdWxhdGlvbkVycm9yKFwiVGhlcmUgYXJlIHNvbWUgaW5jb3JyZWN0IGV4cHJlc3Npb25zXCIpXG5cbiAgICBpZiAoLyhcXGQrKFxcLlxcZCspPylcXHMrKFxcZCsoXFwuXFxkKyk/KXwoXFxkKyhcXC5cXGQrKT8pXFxzK1xcKHxcXCkoXFxzKyk/KFxcZCsoXFwuXFxkKyk/KS8udGVzdChvcGVyYXRpb24pKVxuICAgICAgdGhyb3cgbmV3IENhbGN1bGF0aW9uRXJyb3IoXCJUaGUgdHlwZXMgb2YgYXJpdGhtZXRpYyBvcGVyYXRpb24gYmV0d2VlbiBudW1iZXJzIGFyZSBub3QgZGVmaW5lZFwiKVxuXG4gICAgaWYgKC8oXFxkKyhcXC5cXGQrKT8pXFxzKyhbYS16QS1aX11cXHcqKXwoW2EtekEtWl9dXFx3KilcXHMrKFxcZCsoXFwuXFxkKyk/fFxcKCl8XFwpKFxccyspPyhbYS16QS1aX11cXHcqKXwoW2EtekEtWl9dXFx3KilcXHMrKFthLXpBLVpfXVxcdyopLy50ZXN0KG9wZXJhdGlvbikpXG4gICAgICB0aHJvdyBuZXcgQ2FsY3VsYXRpb25FcnJvcihcIlRoZSB0eXBlcyBvZiBhcml0aG1ldGljIG9wZXJhdGlvbiBiZXR3ZWVuIHZhcmlhYmxlcyBhcmUgbm90IGRlZmluZWRcIilcblxuICAgIGlmICgvKChcXHcrfFxcZCsoXFwuXFxkKykpW1xcLVxcK1xcKlxcL10rKSg/IShcXHMrKT8oXFwoKT8oKFxcLXxcXCspKyk/KFxcdyt8XFxkKyhcXC5cXGQpKykpfF4oXFxzKyk/KFtcXCpcXC9dK1xcdyspLy50ZXN0KG9wZXJhdGlvbikpXG4gICAgICB0aHJvdyBuZXcgQ2FsY3VsYXRpb25FcnJvcihcIk9uZSBzaWRlIG9mIHRoZSBjYWxjdWxhdGlvbiBpcyBzZWxlY3RlZFwiKVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoZSBvcmRlciBvZiB0aGUgUGFyZW50aGVzZXNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wZXJhdGlvbiBcbiAgICovXG4gIGlzT3BlcmF0aW9uSGF2ZVBhcmVudGhlc2VzKG9wZXJhdGlvbikge1xuICAgIGlmICgvXFwoK3xcXCkrLy50ZXN0KG9wZXJhdGlvbikpXG4gICAgICB0aHJvdyBuZXcgQ2FsY3VsYXRpb25FcnJvcihcIlRoZSBhcml0aG1ldGljIG9wZXJhdGlvbiBpcyB3cm9uZywgbXVzdCBiZSBjaGVjayB0aGUgb3JkZXIgb2YgdGhlIHBhcmVudGhlc2VzXCIpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcmVzdWx0IG9mIG9wZXJhdGlvbnMgaW5zaWRlIHBhcmVudGhlc2VzIGFzIHRleHRcbiAgICog2KfYuEBwYXJhbSB7c3RyaW5nfSBvcGVyYXRpb24gXG4gICAqIEByZXR1cm5zIFxuICAgKi9cbiAgYXN5bmMgaGlnaFByZWNlZGVuY2Uob3BlcmF0aW9uKSB7XG5cbiAgICBsZXQgbWF0Y2ggPSBvcGVyYXRpb24ubWF0Y2goLyhcXCgoKCgoXFwrfFxcLSkrKT8oXFxkK3xcXGQrXFwuXFxkKykpKCgoXFwrfFxcLSkrfChcXCp8XFwvKSkpPykrKFxcZCt8XFxkK1xcLlxcZCspP1xcKSkvKTtcblxuICAgIGlmICghbWF0Y2gpXG4gICAgICByZXR1cm4gb3BlcmF0aW9uXG5cbiAgICBsZXQgaW5zaWRlT3BlcmF0aW9uID0gbWF0Y2hbMF0ubWF0Y2goLyg/IVxcKCkuKyg/PVxcKSkvZylbMF1cblxuICAgIGxldCByZXN1bHQgPSBhd2FpdCB0aGlzLmhpZ2hQcmVjZWRlbmNlKGluc2lkZU9wZXJhdGlvbilcbiAgICByZXN1bHQgPSBhd2FpdCB0aGlzLm1lZGl1bVByZWNlZGVuY2UocmVzdWx0KVxuICAgIHJlc3VsdCA9IHRoaXMubG93ZXN0UHJlY2VkZW5jZShyZXN1bHQpXG4gICAgb3BlcmF0aW9uID0gdGhpcy5yZXN1bHRSZXBsYWNlKG9wZXJhdGlvbiwgcmVzdWx0LCBtYXRjaC5pbmRleCwgbWF0Y2hbMF0ubGVuZ3RoKVxuXG4gICAgcmV0dXJuIHRoaXMuaGlnaFByZWNlZGVuY2Uob3BlcmF0aW9uKVxuXG4gIH1cblxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSByZXN1bHQgb2YgbXVsdGlwbGljYXRpb24gYW5kIGRpdmlzaW9uIG9wZXJhdGlvbnMgaW5zaWRlIGEgdGV4dCBhcyB0ZXh0XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3BlcmF0aW9uIFxuICAgKiBAcmV0dXJucyBcbiAgICovXG4gIG1lZGl1bVByZWNlZGVuY2Uob3BlcmF0aW9uKSB7XG5cbiAgICBsZXQgcmVzdWx0XG4gICAgbGV0IG1hdGNoO1xuXG4gICAgbWF0Y2ggPSBvcGVyYXRpb24ubWF0Y2goLygoXFwtKT9cXGQrKFxcLlxcZCspPykoXFxzKyk/KFxcKnxcXC8pKFxccyspPygoKFxcLXxcXCspKyk/KFxccyspPykoXFxkKyhcXC5cXGQrKT8pLyk7XG5cbiAgICBpZiAoIW1hdGNoKVxuICAgICAgcmV0dXJuIG9wZXJhdGlvblxuXG4gICAgbGV0IFtudW1iZXIxLCB0eXBlLCBudW1iZXIyXSA9IG1hdGNoWzBdLm1hdGNoKC8oKFxcZCsoXFwuXFxkKyk/KShcXHMrKT8oPz0oXFwqfFxcLykpKXwoXFwqfFxcLyl7MSx9KFxccyspP3woKChcXC18XFwrKSspPyhcXGQrKFxcLlxcZCspPykpXFxzPy9nKVxuXG4gICAgbnVtYmVyMiA9IHRoaXMuY2FsY1NpbmdPZk51bWJlcihudW1iZXIyKVxuXG4gICAgc3dpdGNoICh0eXBlLnRyaW0oKSkge1xuICAgICAgY2FzZSBcIipcIjpcbiAgICAgICAgcmVzdWx0ID0gK251bWJlcjEgKiArbnVtYmVyMlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCIvXCI6XG4gICAgICAgIGlmICgrbnVtYmVyMiA9PSAwKVxuICAgICAgICAgIHRocm93IG5ldyBDYWxjdWxhdGlvbkVycm9yKFwiRGl2aXNpb24gYnkgemVybyBpcyB1bmRlZmluZWRcIilcbiAgICAgICAgcmVzdWx0ID0gK251bWJlcjEgLyArbnVtYmVyMlxuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIG9wZXJhdGlvbiA9IHRoaXMucmVzdWx0UmVwbGFjZShvcGVyYXRpb24sIHJlc3VsdCwgbWF0Y2guaW5kZXgsIG1hdGNoWzBdLmxlbmd0aClcblxuICAgIHJldHVybiB0aGlzLm1lZGl1bVByZWNlZGVuY2Uob3BlcmF0aW9uKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHJlc3VsdCBvZiBhZGRpdGlvbiBhbmQgc3VidHJhY3Rpb24gb3BlcmF0aW9ucyBpbnNpZGUgdGhlIHRleHQgYXMgdGV4dFxuICAgKlxuICAgKiAgIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3BlcmF0aW9uIFxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzdHJpbmdcbiAgICovXG4gIGxvd2VzdFByZWNlZGVuY2Uob3BlcmF0aW9uKSB7XG5cbiAgICBsZXQgcmVzdWx0XG4gICAgbGV0IG1hdGNoO1xuXG4gICAgbWF0Y2ggPSBvcGVyYXRpb24ubWF0Y2goLygoKFxcLXxcXCspKyk/XFxkKyhcXC5cXGQrKT8pKFxccyspPyhcXCt8XFwtKSsoXFxzKyk/KFxcZCsoXFwuXFxkKyk/KS8pXG5cbiAgICBpZiAoIW1hdGNoKVxuICAgICAgcmV0dXJuIG9wZXJhdGlvblxuXG5cbiAgICBsZXQgW251bWJlcjEsIHR5cGUsIG51bWJlcjJdID0gbWF0Y2hbMF0ubWF0Y2goLygoKChcXC18XFwrKSspP1xcZCsoXFwuXFxkKyk/KVxccz8oPz0oXFwtfFxcKykpKXwoXFwtfFxcKyl7MSx9XFxzP3woXFxkKyhcXC5cXGQrKT8pXFxzPy9nKVxuICAgIHR5cGUgPSB0aGlzLmNhbGNTaWduKHR5cGUpXG4gICAgbnVtYmVyMSA9IHRoaXMuY2FsY1NpbmdPZk51bWJlcihudW1iZXIxKVxuXG4gICAgc3dpdGNoICh0eXBlLnRyaW0oKSkge1xuICAgICAgY2FzZSBcIitcIjpcbiAgICAgICAgcmVzdWx0ID0gK251bWJlcjEgKyArbnVtYmVyMlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgIHJlc3VsdCA9ICtudW1iZXIxIC0gK251bWJlcjJcbiAgICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBvcGVyYXRpb24gPSB0aGlzLnJlc3VsdFJlcGxhY2Uob3BlcmF0aW9uLCByZXN1bHQsIG1hdGNoLmluZGV4LCBtYXRjaFswXS5sZW5ndGgpXG5cbiAgICByZXR1cm4gdGhpcy5sb3dlc3RQcmVjZWRlbmNlKG9wZXJhdGlvbilcbiAgfVxuXG4gIC8qKlxuICAgKiAgQ2FsY3VsYXRlIHRoZSBzaWduIGlmIHRoZXJlIGlzIG1vcmUgdGhhbiBvbmUgc2lnbiBcbiAgICogXG4gICAqICBwYXJhbTogc2lnbiBTdHJpbmcgb2Ygb25lIG9yIG1vcmUgKyBvciAtXG4gICAqIFxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2lnbiBcbiAgICogQHJldHVybnMge1N0cmluZ30gcmVhbCBzaWduIGFzIHN0cmluZ1xuICAgKi9cbiAgY2FsY1NpZ24oc2lnbikge1xuXG4gICAgaWYgKHNpZ24ubGVuZ3RoIDwgMilcbiAgICAgIHJldHVybiBzaWduXG5cbiAgICByZXR1cm4gc2lnbi5zcGxpdChcIlwiKVxuICAgICAgLnJlZHVjZSgocHJlLCBjdXIpID0+ICgrYCR7cHJlfTFgICogK2Ake2N1cn0xYCkgPiAwID8gXCIrXCIgOiBcIi1cIilcbiAgfVxuXG4gIC8qKlxuICAgKiAgQ2FsY3VsYXRlIHRoZSBzaWduIG9mIHRoZSBudW1iZXIgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBzaWduIFxuICAgKiAgXG4gICAqICBwYXJhbXMgOiBudW1iZXIgaGFzIG11bHRpIHNpZ25zICsgb3IgLVxuICAgKiBcbiAgICogQHBhcmFtIHtTdHJpbmd9IG51bWJlciAgXG4gICAqIEByZXR1cm5zIHRoZSBudW1iZXIgd2l0aCByZWFsIHNpZ24gYXMgc3RyaW5nXG4gICAqL1xuICBjYWxjU2luZ09mTnVtYmVyKG51bWJlcikge1xuXG4gICAgbGV0IGNhbGMgPSBudW1iZXIubWF0Y2goLyhcXGQrKFxcLlxcZCspPyl8KFxcLXxcXCspKy9nKVxuXG4gICAgaWYgKCFjYWxjKSByZXR1cm5cblxuICAgIGlmIChjYWxjLmxlbmd0aCAhPSAxKVxuICAgICAgY2FsY1swXSA9IHRoaXMuY2FsY1NpZ24oY2FsY1swXSlcblxuICAgIHJldHVybiBjYWxjLmpvaW4oXCJcIilcblxuICB9XG5cbiAgLyoqXG4gICAqIHJlcGxhY2UgdGhlIHJlc3VsdCBmcm9tIG9wZXJhdGlvbiBpbiB0aGUgcGxhY2UgaXQgaW4gdGhlIG9yaWdpbmFsIHRleHQgXG4gICAqIFxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3JpZ2luYWwgb3BlcmF0aW9uIFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcmVzdWx0IGZyb20gb3BlcmF0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgb3BlcmF0aW9uIGluIHRoZSBvcmlnaW5hbCB0ZXh0XG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggb2YgdGhlIG9wZXJhdGlvbiB0ZXh0IGludG8gdGhlIG9yaWdpbmFsIHRleHRcbiAgICogXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IG9yaWdpbmFsIHN0cmluZyB3aXRoIHJlcGxhY2UgdGhlIG9sZCBvcGVyYXRpb24gYnkgcmVzdWx0IFxuICAgKi9cbiAgcmVzdWx0UmVwbGFjZShvcmlnaW5hbCwgcmVzdWx0LCBzdGFydCwgbGVuZ3RoKSB7XG5cbiAgICBsZXQgZmlyc3RUZXh0ID0gKHN0YXJ0ID09IDApID8gXCJcIiA6IG9yaWdpbmFsLnN1YnN0cmluZygwLCBzdGFydClcblxuICAgIGxldCBsYXN0VGV4dCA9IG9yaWdpbmFsLnN1YnN0cmluZyhsZW5ndGggKyBzdGFydClcblxuICAgIHJldHVybiBmaXJzdFRleHQgKyByZXN1bHQgKyBsYXN0VGV4dFxuICB9XG5cbn1cblxuXG4vLyBleHBvcnRzLkNhbGN1bGF0aW9uID0gQ2FsY3VsYXRpb25cbi8vIGV4cG9ydHMuQ2FsY3VsYXRpb25FcnJvciA9IENhbGN1bGF0aW9uRXJyb3IiLCJjb25zdCBTZWxlY3RFbCA9IGVsID0+IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWwpXG5cbi8vIGVsZW1lbnRzXG5jb25zdCByZXN1bHRfZWxlID0gU2VsZWN0RWwoYC5yZXN1bHRfX2NhbGN1bGF0aW9uYCksXG5cbiAgY2FsY3VsYXRpb25JbnB1dCA9IFNlbGVjdEVsKFwiI2NhbGN1bGF0aW9uXCIpLFxuICB2YXJpYWJsZUlucHV0ID0gU2VsZWN0RWwoXCIjdmFyaWFibGVcIiksXG4gIGRlc2NJbnB1dCA9IFNlbGVjdEVsKFwiI25vdGVcIiksXG5cbiAgZXJyb3JDYWxjID0gU2VsZWN0RWwoXCIubWVzc2FnZV9faW5wdXRfX2NhbGN1bGF0aW9uXCIpLFxuICBlcnJvclZhciA9IFNlbGVjdEVsKFwiLm1lc3NhZ2VfX3ZhcmlhYmxlXCIpLFxuXG5cbiAgbGlzdEhpc3RvcnkgPSBTZWxlY3RFbChcIi5oaXN0b3J5IC5saXN0X19oaXN0b3J5XCIpLFxuICBlbXB0eUhpc3RvcnkgPSBTZWxlY3RFbChcIi5lbXB0eV9faGlzdG9yeVwiKSxcbiAgdGVtcGxhdGVIaXN0b3J5SXRlbSA9IFNlbGVjdEVsKFwiI2l0ZW1fX2hpc3RvcnlfX3RlbXBsYXRlXCIpLmNvbnRlbnRcblxuLy8gXG5jb25zdCBjYWxjID0gbmV3IENhbGN1bGF0aW9uKClcblxuXG4vLyBoYXMgYWxsIGNhbGN1bGF0aW9uIHNhdmVkIGluIGFwcFxuY29uc3QgaGlzdG9yeUxpc3RzID0ge31cblxubGV0IGN1cnJlbnRpZCxcbiAgY3VycmVudFJlc3VsdCA9IFwiMFwiLFxuICB2YXJpYWJsZUV4aXN0ID0gZmFsc2VcblxuLy8gd2hlIGRvbSBsb2FkZWQgXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBhcHApXG5cbmZ1bmN0aW9uIGFwcCgpIHtcblxuICAvLyBjYWxjdWxhdGlvbiBwcm9jZXNzXG4gIGNhbGN1bGF0aW9uSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIGNhbGN1bGF0aW9uX3Byb2Nlc3MpXG5cbiAgLy8gaW5wdXQgdmFyaWFibGUgbmFtZSBcbiAgdmFyaWFibGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgdmFyaWFibGVfcHJvY2VzcylcblxuICAvLyBvcGVuIGhpc3Rvcnkgc2VjdGlvbiBpbiBzbSBzY3JlZW4gXG4gIFNlbGVjdEVsKFwiLmNhbGN1bGF0b3IgLnNob3ctaGlzdG9yeS1tYlwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5oaXN0b3J5XCIpLmNsYXNzTGlzdC5hZGQoXCJvcGVuX19oaXN0b3J5XCIpKVxuXG4gIC8vIGNsb3NlIGhpc3Rvcnkgc2VjdGlvbiBpbiBzbSBzY3JlZW4gXG4gIFNlbGVjdEVsKFwiLmhpc3RvcnkgLmNsb3NlLWhpc3RvcnktbWJcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuaGlzdG9yeVwiKS5jbGFzc0xpc3QucmVtb3ZlKFwib3Blbl9faGlzdG9yeVwiKSlcblxuICAvLyAgc2F2ZSBjYWxjdWxhdGlvblxuICBTZWxlY3RFbChcIi5jYWxjdWxhdG9yIC5idG5fX3NhdmVcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJlZ2lzdGVySXRlbSlcblxuICAvLyBjbGVhbiBhbGwgaW5wdXQgZWxlbWVudFxuICBTZWxlY3RFbChcIi5idG5fX2NsZWFuXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCByZXNldEZyb20pXG5cblxufVxuXG5cblxuXG4vLyAtLS0tIHN0YXJ0IGNhbGN1bGF0aW9uIHByb2Nlc3NcblxubGV0IHNldFRpbWVJbnB1dENhbGN1bGF0aW9uXG5cbmZ1bmN0aW9uIGNhbGN1bGF0aW9uX3Byb2Nlc3Moe1xuICB0YXJnZXRcbn0pIHtcblxuXG4gIGNvbnN0IHZhbHVlID0gdGFyZ2V0LnZhbHVlXG5cbiAgZXJyb3JDYWxjLnRleHRDb250ZW50ID0gXCJcIlxuICBjbGVhclRpbWVvdXQoc2V0VGltZUlucHV0Q2FsY3VsYXRpb24pXG5cblxuICBzZXRUaW1lSW5wdXRDYWxjdWxhdGlvbiA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG5cbiAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBjYWxjLnByb2Nlc3ModmFsdWUpXG5cbiAgICAgIGxldCBrZXkgPSB2YXJpYWJsZUlucHV0LnZhbHVlXG4gICAgICBpZiAoa2V5KSBDYWxjdWxhdGlvbi5zZXRWYXIoa2V5LCByZXN1bHQpXG5cbiAgICAgIHJlc3VsdF9lbGUudGV4dENvbnRlbnQgPSBjdXJyZW50UmVzdWx0ID0gcmVzdWx0IHx8ICcwJ1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgZXJyb3JDYWxjLnRleHRDb250ZW50ID0gZXJyb3IubWVzc2FnZVxuXG4gICAgfVxuICB9LCAxMjAwKVxufVxuXG5sZXQgc2V0VGltZUlucHV0VmFyaWFibGVcblxuZnVuY3Rpb24gdmFyaWFibGVfcHJvY2Vzcyh7XG4gIHRhcmdldFxufSkge1xuXG4gIGxldCBrZXkgPSB0YXJnZXQudmFsdWVcblxuICBpZiAoIWtleSkgcmV0dXJuXG5cbiAgY2xlYXJUaW1lb3V0KHNldFRpbWVJbnB1dFZhcmlhYmxlKVxuXG4gIHNldFRpbWVJbnB1dFZhcmlhYmxlID0gc2V0VGltZW91dCgoKSA9PiB7XG5cblxuICAgIGVycm9yVmFyLnRleHRDb250ZW50ID0gXCJcIlxuXG4gICAgdHJ5IHtcblxuICAgICAgaWYgKENhbGN1bGF0aW9uLmlzVmFyRXhpc3Qoa2V5KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHZhcmlhYmxlIGV4aXN0cywgdHJ5IGFub3RoZXIgb25lXCIpXG5cbiAgICAgIENhbGN1bGF0aW9uLnNldFZhcihrZXksIGN1cnJlbnRSZXN1bHQpXG4gICAgICB2YXJpYWJsZUV4aXN0ID0gZmFsc2VcbiAgICAgIGN1cnJlbnRpZCA9IG51bGxcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB2YXJpYWJsZUV4aXN0ID0gdHJ1ZVxuICAgICAgZXJyb3JWYXIudGV4dENvbnRlbnQgPSBlcnJvci5tZXNzYWdlXG4gICAgfVxuICB9LCAxMjAwKVxufVxuXG4vLyAgUmVnaXN0ZXIgYSBuZXcgaXRlbSBpbiBoaXN0b3J5XG5mdW5jdGlvbiByZWdpc3Rlckl0ZW0oKSB7XG5cbiAgY3VycmVudGlkID0gY3VycmVudGlkIHx8IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMTAwKSArIERhdGUubm93KClcblxuXG4gIGhpc3RvcnlMaXN0c1tjdXJyZW50aWRdID0ge1xuICAgIHJlc3VsdDogY3VycmVudFJlc3VsdCA/PyBcIjBcIixcbiAgICBjYWxjOiBjYWxjdWxhdGlvbklucHV0LnZhbHVlID8/IFwiMFwiLFxuICAgIGRlc2M6IGRlc2NJbnB1dC52YWx1ZSA/PyBcIlwiLFxuICAgIHZhcmlhYmxlOiB2YXJpYWJsZUlucHV0LnZhbHVlID8/IFwiXCJcbiAgfVxuXG4gIGNyZWF0ZUhpc3RvcnlJdGVtKGhpc3RvcnlMaXN0c1tjdXJyZW50aWRdLCBjdXJyZW50aWQpXG59XG5cbi8vIGNyZWF0ZSBuZXcgaXRlbSBpbiBoaXN0b3J5XG5mdW5jdGlvbiBjcmVhdGVIaXN0b3J5SXRlbShkYXRhLCBpZCkge1xuXG4gIGlmIChjYWxjdWxhdGlvbklucHV0LnZhbHVlLnRyaW0oKSA9PT0gXCJcIiB8fCB2YXJpYWJsZUV4aXN0KSByZXR1cm5cblxuICBpZiAoZW1wdHlIaXN0b3J5LmNsYXNzTGlzdC5jb250YWlucyhcInNob3dfX2VtcHR5X19oaXN0b3J5XCIpKVxuICAgIGVtcHR5SGlzdG9yeS5jbGFzc0xpc3QucmVtb3ZlKFwic2hvd19fZW1wdHlfX2hpc3RvcnlcIilcblxuICBjb25zdCBjdXJyZW50TGkgPSBTZWxlY3RFbChgbGlbZGF0YS1pZD1cIiR7aWR9XCJdYClcblxuICBsZXQgbGlDbG9uZVxuXG4gIGlmIChjdXJyZW50TGkpIHtcbiAgICBsaUNsb25lID0gY3VycmVudExpXG4gIH0gZWxzZSB7XG5cbiAgICBsaUNsb25lID0gdGVtcGxhdGVIaXN0b3J5SXRlbS5jbG9uZU5vZGUodHJ1ZSlcbiAgICAvLyBhZGQgYXR0cmlidXRlXG4gICAgbGlDbG9uZS5xdWVyeVNlbGVjdG9yKFwibGlcIikuZGF0YXNldC5pZCA9IGlkXG5cbiAgICAvLyBzZXQgZXZlbnRcbiAgICAvLyBlZGl0IGNhbGNcbiAgICBsaUNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIuYnRuX19lZGl0XCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBlZGl0Q2FsYylcbiAgICAvLyBkZWxldGUgY2FsY1xuICAgIGxpQ2xvbmUucXVlcnlTZWxlY3RvcihcIi5idG5fX2RlbFwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZGVsZXRlQ2FsYylcbiAgfVxuXG4gIC8vIGFkZCBkYXRhXG4gIGxpQ2xvbmUucXVlcnlTZWxlY3RvcihcIi52YXJpYWJsZV9faXRlbVwiKS50ZXh0Q29udGVudCA9IGRhdGEudmFyaWFibGUgKyBcIiA9IFwiXG4gIGxpQ2xvbmUucXVlcnlTZWxlY3RvcihcIi5yZXN1bHRfX2l0ZW1cIikudGV4dENvbnRlbnQgPSBkYXRhLnJlc3VsdFxuICBsaUNsb25lLnF1ZXJ5U2VsZWN0b3IoXCIubm90ZV9faXRlbV9faGlzdG9yeVwiKS50ZXh0Q29udGVudCA9IGRhdGEuZGVzY1xuXG5cbiAgbGlzdEhpc3RvcnkucHJlcGVuZChsaUNsb25lKVxuICByZXNldEZyb20oKVxuXG59XG5cbi8vIGVkaXQgY2FsYyBpdGVtIGJ5IGlkXG5mdW5jdGlvbiBlZGl0Q2FsYyh7IHRhcmdldCB9KSB7XG4gIGNvbnN0IGVsID0gdGFyZ2V0LmNsb3Nlc3QoXCIuaXRlbV9faGlzdG9yeVwiKVxuICBjdXJyZW50aWQgPSBlbC5kYXRhc2V0LmlkXG5cbiAgaW5pdEZyb20oaGlzdG9yeUxpc3RzW2N1cnJlbnRpZF0pXG5cbn1cblxuLy8gZGVsZXRlIGNhbGMgaXRlbSBpbiBoaXN0b3J5IGxpc3QgYnkgaWQgXG5mdW5jdGlvbiBkZWxldGVDYWxjKHsgdGFyZ2V0IH0pIHtcbiAgY29uc3QgZWwgPSB0YXJnZXQuY2xvc2VzdChcIi5pdGVtX19oaXN0b3J5XCIpXG4gIGlkID0gZWwuZGF0YXNldC5pZFxuXG4gIGRlbGV0ZSBoaXN0b3J5TGlzdHNbaWRdXG4gIGVsLnJlbW92ZSgpXG5cbiAgaWYgKE9iamVjdC5rZXlzKGhpc3RvcnlMaXN0cykubGVuZ3RoIDwgMSlcbiAgICBlbXB0eUhpc3RvcnkuY2xhc3NMaXN0LmFkZChcInNob3dfX2VtcHR5X19oaXN0b3J5XCIpXG5cbiAgcmVzZXRGcm9tKClcbn1cblxuLy8gY2xlYW4gYWxsIGZyb20gaW5wdXQgZWxlbWVudFxuZnVuY3Rpb24gaW5pdEZyb20oZGF0YSA9IHt9KSB7XG5cbiAgY2FsY3VsYXRpb25JbnB1dC52YWx1ZSA9IGRhdGEuY2FsYyA/PyBcIlwiXG4gIHZhcmlhYmxlSW5wdXQudmFsdWUgPSBkYXRhLnZhcmlhYmxlID8/IFwiXCJcbiAgZGVzY0lucHV0LnZhbHVlID0gZGF0YS5kZXNjID8/IFwiXCJcbiAgZXJyb3JDYWxjLnRleHRDb250ZW50ID0gZGF0YS5jYWxjRXJyID8/IFwiXCJcbiAgZXJyb3JWYXIudGV4dENvbnRlbnQgPSBkYXRhLnZhckVyciA/PyBcIlwiXG4gIHJlc3VsdF9lbGUudGV4dENvbnRlbnQgPSBkYXRhLnJlc3VsdCA/PyBcIjBcIlxuXG59XG5cbi8vIGNsZWFuIGFsbCBmcm9tIGlucHV0IGVsZW1lbnRcbmZ1bmN0aW9uIHJlc2V0RnJvbSgpIHtcbiAgaW5pdEZyb20oKVxuICBjdXJyZW50aWQgPSBudWxsXG59Il19
