document.addEventListener("DOMContentLoaded", app)

function app() {

  // when click in any point in page
  document.addEventListener("click", on_click_document)

  // when click on the btn__openMenu button 
  // show menu
  const btn__openMenu = document.querySelector("#btn__open-menu")
  const nav__menu = document.querySelector(".menu")

  btn__openMenu.addEventListener("click", () => {
    nav__menu.style.transform = "scale(1)"
    nav__menu.style.opacity = "1"
  })


  create_calculation_section()

  // create new calculation div
  const btn_add_new = document.querySelector(".new_calculation button")
  btn_add_new.addEventListener("click", create_calculation_section)
}

function on_click_document({
  target
}) {

  const nav__menu = document.querySelector(".menu")

  // close menu in navbar if is opened 
  if (!target.closest("#btn__open-menu")) {
    nav__menu.style.transform = "scale(0)"
    nav__menu.style.opacity = "0"
  }

  // in small screen

  // hide variable input when click any where in the page 
  const enable_variable = document.querySelector(".enable-variable")
  if (!target.closest(".result_container") && enable_variable)
    enable_variable.classList.remove("enable-variable")

  // hide comment textarea when click any where in the page 
  const enable_comment = document.querySelector(".enable-comment")
  if ((!target.closest(".comment_container") && !target.closest(".show-comment")) && enable_comment)
    enable_comment.classList.remove("enable-comment")

}

let calculation_section_id = 1

function create_calculation_section() {
  const clone_calc_template = document.querySelector("#calculation-template").content.cloneNode(true),
    new_calculation_container = document.querySelector(".new_calculation")

  // show variable input 
  const btn_variable = clone_calc_template.querySelector(".show-variable")
  btn_variable.addEventListener("click", toggle_variable_input)

  // show comment textarea 
  const btn_comment = clone_calc_template.querySelector(".show-comment")
  btn_comment.addEventListener("click", toggle_comment_input)


  clone_calc_template.querySelector(".result").dataset.id = calculation_section_id

  const calculationInput = clone_calc_template.querySelector(".calculation")
  calculationInput.dataset.id = calculation_section_id
  calculationInput.addEventListener("input", calculation_process)

  const variableInput = clone_calc_template.querySelector(".variable")
  variableInput.dataset.id = calculation_section_id
  variableInput.addEventListener("input", variable_process)

  new_calculation_container.before(clone_calc_template)
  calculation_section_id++

}

// ---- start calculation process

const calc = new Calculation()
let setTimeInputCalculation

function calculation_process({
  target
}) {
  let id = target.dataset.id
  const errorElement = target.parentElement.querySelector(".calculation_container .error-message")
  const result_ele = document.querySelector(`.result[data-id='${id}']`)
  const var_input = document.querySelector(`.variable[data-id='${id}']`)

  errorElement.textContent = ""
  clearTimeout(setTimeInputCalculation)


  setTimeInputCalculation = setTimeout(async () => {
    try {

      let result = await calc.process(target.value),
        key = var_input.value

      if (key) {

        Calculation.setVar(key, result)

        // if (Calculation.isVarExist(key)) {
        //   calcAllSections(id)
        // }
      }

      result_ele.textContent = result || '0'

    } catch (error) {

      errorElement.textContent = error.message
      errorElement.style.transform = "scale(1)"

    }
  }, 1200)

}

function calcAllSections(textareaId) {

  let allCalculationBox = document.querySelectorAll(".calculation_box")

  allCalculationBox.forEach(async el => {

    let textarea = el.querySelector(".calculation")
    // if (textarea.id == textareaId)
    //   return

    let result = await calc.process(textarea.value)
    el.querySelector(".result").textContent = result || 0
    if (el.querySelector(".variable").value)
      Calculation.setVar(el.querySelector(".variable").value, result)
  })
}

let setTimeInputVariable

function variable_process({
  target
}) {

  let key = target.value

  if (!key) return

  clearTimeout(setTimeInputVariable)

  setTimeInputVariable = setTimeout(() => {

    const errorElement = target.parentElement.querySelector(".variable_container .error-message")
    const result_ele = document.querySelector(`.result[data-id='${target.dataset.id}']`)

    errorElement.textContent = " "

    if (Calculation.isVarExist(key)) {
      errorElement.style.transform = "scale(1)"
      errorElement.textContent = "The variable exists, it will be overwrite"
    }

    try {
      Calculation.setVar(key, result_ele.textContent)

    } catch (error) {
      errorElement.style.transform = "scale(1)"
      errorElement.textContent = error.message
    }



  }, 1200)

}

// for mobile

function toggle_comment_input({
  currentTarget
}) {
  const enable_comment = document.querySelector(".enable-comment")
  if (enable_comment)
    enable_comment.classList.remove("enable-comment")
  const comment_container = currentTarget.parentElement.querySelector(".comment_container")
  comment_container.classList.toggle("enable-comment")
}

function toggle_variable_input({
  currentTarget
}) {
  const enable_variable = document.querySelector(".enable-variable")
  if (enable_variable)
    enable_variable.classList.remove("enable-variable")
  const comment_container = currentTarget.parentElement.querySelector(".variable_container")
  comment_container.classList.toggle("enable-variable")
}