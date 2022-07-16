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