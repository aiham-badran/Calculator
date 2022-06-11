const {
  Calculation,
  CalculationError
} = require("../js/calculation.js")

const calc = new Calculation()

describe("test basic calculation", () => {

  test("if just number", async () => {
    const process = await calc.process("8")
    expect(process).toEqual("8")
  })

  test("if just float number", async () => {
    const process = await calc.process("8.5")
    expect(process).toEqual("8.5")
  })

  test("if just negative number", async () => {
    const process = await calc.process("-8")
    expect(process).toEqual("-8")
  })

  test("if just negative float number", async () => {
    const process = await calc.process("-645.1254")
    expect(process).toEqual("-645.1254")
  })

})

describe("test collection calculation", () => {
  test("multi collection process", async () => {
    const process = await calc.process("4 + 4 + 2 + 1")
    expect(process).toEqual("11")
  })

  test("Simple collection process", async () => {
    const process = await calc.process("4 + 4")
    expect(process).toEqual("8")
  })

  test("multi collection process with floating number", async () => {
    const process = await calc.process("4.56 + 4.5 + 2 + 1.846")
    expect(+process).toBeCloseTo(12.906, 3)
  })

  test("Simple collection process with floating number", async () => {
    const process = await calc.process("4.4 + 4.8")
    expect(process).toEqual("9.2")
  })
})


describe("test subtraction calculation", () => {

  test("Simple subtraction process", async () => {
    const process = await calc.process("4 - 2 ")
    expect(process).toEqual("2")
  })

  test("Multiple subtraction process with negative result", async () => {
    const process = await calc.process("2 - 4 ")
    expect(process).toEqual("-2")
  })

  test("Multiple subtraction process negative result", async () => {
    const process = await calc.process("6 - 1 - 6")
    expect(process).toEqual("-1")
  })

  test("Multiple subtraction process with negative result and floating number", async () => {
    const process = await calc.process("2.5 - 4.657 ")
    expect(+process).toBeCloseTo(-2.157, 3)
  })
})




describe("test subtraction and collection calculation", () => {

  test("Multiple subtraction process and collection process", async () => {
    const process = await calc.process("5+5-5")
    expect(process).toEqual("5")
  })

  test("Multiple subtraction process and collection process negative result", async () => {
    const process = await calc.process("-6 - 1 - 6 + 1")
    expect(process).toEqual("-12")
  })

  test("Multiple subtraction process and collection process negative result with multi sign", async () => {
    const process = await calc.process("---6 --- 1 --- 6 +++ 1")
    expect(process).toEqual("-12")
  })

})


describe("test multiplication calculation", () => {

  test("Simple multiplication process", async () => {
    const process = await calc.process("2*2")
    expect(process).toEqual("4")
  })

  test("Multiple multiplication process with negative result", async () => {
    const process = await calc.process("11*5*3*-9")
    expect(process).toEqual("-1485")
  })

  test("Multiple multiplication process negative result with spaces", async () => {
    const process = await calc.process(" 14 * 6 *   ---5")
    expect(process).toEqual("-420")
  })

  test("Simple multiplication process", async () => {
    const process = await calc.process("2.54*2.98")
    expect(+process).toBeCloseTo(7.56, 1)
  })
})



describe("test division calculation", () => {

  test("Simple division process", async () => {
    const process = await calc.process("2/2")
    expect(process).toEqual("1")
  })

  test("Multiple division process with negative result", async () => {
    const process = await calc.process("147/5/6/-2")
    expect(+process).toBeCloseTo(-2.45, 2)
  })

  test("Multiple division process negative result with spaces", async () => {
    const process = await calc.process(" 12 / -2 /   ---5")
    expect(+process).toBeCloseTo(1.2, 2)
  })

  test("Simple division process", async () => {
    const process = await calc.process("2.4/2.4")
    expect(process).toEqual("1")
  })

})

describe("nested arithmetic operations using parentheses", () => {

  test("Simple arithmetic with parentheses ", async () => {
    const process = await calc.process("2*(1+1)")
    expect(process).toEqual("4")
  })

  test("Simple arithmetic with parentheses using floating number ", async () => {
    const process = await calc.process("2.4*(--1.4+--1.545)")
    expect(+process).toBeCloseTo(7.068)
  })

  test("Several overlapping parentheses - collection", async () => {
    const process = await calc.process("(1+1+(3-1+(1+2)))+2")
    expect(process).toEqual("9")
  })

  test("Several overlapping parentheses - subtraction", async () => {
    const process = await calc.process("(15+10-(3-1+(1-2)))-4")
    expect(process).toEqual("20")
  })

  test("Several overlapping parentheses - multiplication", async () => {
    const process = await calc.process("2*4-(15+1-(6/2+(1-2)))-4")
    expect(process).toEqual("-10")
  })

  test("Several overlapping parentheses - division", async () => {
    const process = await calc.process("24/4*3+(6/3-(6+2+(2-6)))-4+1")
    expect(process).toEqual("13")
  })

  test("Multiple parentheses", async () => {
    const process = await calc.process("1(1+1)+1(1+1)+2(1)")
    expect(+process).toBeCloseTo(6, 0)
  })

  test("Multiple Several overlapping parentheses", async () => {
    const process = await calc.process("1(2(1+2)+(1(1*2)))+(5-(1+(2+1)+1))")
    expect(+process).toBeCloseTo(8, 0)
  })

})


describe("check about variables", () => {

  test("check if variables is exist", () => {
    expect(Calculation.isVarExist("number")).toBeFalsy()
  })

  test("set new variables", () => {
    Calculation.setVar("number", "123")
    expect(Calculation.isVarExist("number")).toBeTruthy()
  })

  test("get variables", () => {
    expect(Calculation.getVar("number")).toEqual("123")
  })

  test("get variables not exist", () => {
    expect(() => Calculation.getVar("myVar")).toThrow(CalculationError)
  })

  test("get variables not exist with message", () => {
    expect(() => Calculation.getVar("myVar")).toThrow("The Variable myVar is not exist")
  })

  test("get variables not exist with message", () => {
    expect(() => Calculation.setVar("%var", "147")).toThrow("The Variable is not valid")
  })

})

Calculation.setVar("number1", "1")
Calculation.setVar("number2", "2")
describe("calculation with variables ", () => {

  test("calculation simple ", async () => {
    const process = await calc.process("number1 + number2")
    expect(process).toEqual("3")
  })

  test("calculation complex", async () => {
    const process = await calc.process("number1(number2(number1+number2)*number2) + number2+(number2/(number2+number2))")
    expect(process).toEqual("14.5")
  })

})

describe("calculation error", () => {
  test("calculation by not exist variable", () => {
    expect(() => calc.process("1 + num")).rejects.toThrowError(CalculationError)
  })

  test("calculation with space between numbers", () => {
    expect(() => calc.process("1 +1  2")).rejects.toThrowError(CalculationError)
  })

  test("calculation with space between variables", () => {
    expect(() => calc.process("number1  (number2   number1)number1")).rejects.toThrowError(CalculationError)
  })

  test("calculation with space between variables", () => {
    expect(() => calc.process("1/0")).rejects.toThrowError(CalculationError)
  })

})



// describe("test result replace function", () => {
//   test("one operation", () => {
//     let text = calc.resultReplace("4+4", "8", 0, 3)
//     expect(text).toEqual("8")
//   })

//   test("two operation", () => {
//     let text = calc.resultReplace("4+4-5", "8", 0, 3)
//     expect(text).toEqual("8-5")
//   })

//   test("two operation different place", () => {
//     let text = calc.resultReplace("4+4*2", "8", 2, 3)
//     expect(text).toEqual("4+8")
//   })

//   test("multi operation in the last", () => {
//     let text = calc.resultReplace("4+4-5*2-5", "10", 4, 3)
//     expect(text).toEqual("4+4-10-5")
//   })

//   test("multi operation ", () => {
//     let text = calc.resultReplace("4*2-5*2-5", "8", 0, 3)
//     expect(text).toEqual("8-5*2-5")
//   })

// })