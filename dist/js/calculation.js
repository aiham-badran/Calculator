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

    return false
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