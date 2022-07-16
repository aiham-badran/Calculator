class CalculationError extends Error{constructor(e,t=""){super(e),this.variable=t}}class Calculation{constructor(){}static Variables={};static setVar(e,t){e=e.trim(),this.isValidationVar(e),this.Variables[e]=t}static getVar(e){if(this.isVarExist(e))return this.Variables[e];throw new CalculationError(`The Variable ${e} is not exist`,e)}static isVarExist(e){return!!this.Variables[e]}static isValidationVar(e){if(!/^[a-zA-Z_]\w*$/.test(e))throw new CalculationError("The Variable is not valid",e)}async process(e){if(/^(\s*)?(\d+|\d+\.\d+)(\s*)?$/.test(e))return e;this.isOperationValid(e),e=(e=(e=e.replace(/[a-zA-Z_]\w*/g,e=>(this.constructor.isVarExist(e),this.constructor.getVar(e)))).replace(/(\d+|\d+\.\d+)(\()/g,(e,t,r)=>t+"*"+r)).replace(/\s+/g,"");let t=await this.highPrecedence(e);return this.isOperationHaveParentheses(t),t=await this.mediumPrecedence(t),t=this.lowestPrecedence(t),this.calcSingOfNumber(t.trim())}isOperationValid(e){if(/([^a-zA-Z_\s\+\-\*\/\(\)]+[a-zA-Z_]+)|[^a-zA-Z_\s\+\-\*\/\(\)\d\.]/.test(e))throw new CalculationError("There are some incorrect expressions");if(/(\d+(\.\d+)?)\s+(\d+(\.\d+)?)|(\d+(\.\d+)?)\s+\(|\)(\s+)?(\d+(\.\d+)?)/.test(e))throw new CalculationError("The types of arithmetic operation between numbers are not defined");if(/(\d+(\.\d+)?)\s+([a-zA-Z_]\w*)|([a-zA-Z_]\w*)\s+(\d+(\.\d+)?|\()|\)(\s+)?([a-zA-Z_]\w*)|([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)/.test(e))throw new CalculationError("The types of arithmetic operation between variables are not defined");if(/((\w+|\d+(\.\d+))[\-\+\*\/]+)(?!(\s+)?(\()?((\-|\+)+)?(\w+|\d+(\.\d)+))|^(\s+)?([\*\/]+\w+)/.test(e))throw new CalculationError("One side of the calculation is selected")}isOperationHaveParentheses(e){if(/\(+|\)+/.test(e))throw new CalculationError("The arithmetic operation is wrong, must be check the order of the parentheses")}async highPrecedence(e){let t=e.match(/(\(((((\+|\-)+)?(\d+|\d+\.\d+))(((\+|\-)+|(\*|\/)))?)+(\d+|\d+\.\d+)?\))/);if(!t)return e;var r=t[0].match(/(?!\().+(?=\))/g)[0],r=await this.highPrecedence(r),r=await this.mediumPrecedence(r);return r=this.lowestPrecedence(r),e=this.resultReplace(e,r,t.index,t[0].length),this.highPrecedence(e)}mediumPrecedence(e){let t,r;if(!(r=e.match(/((\-)?\d+(\.\d+)?)(\s+)?(\*|\/)(\s+)?(((\-|\+)+)?(\s+)?)(\d+(\.\d+)?)/)))return e;let[i,a,s]=r[0].match(/((\d+(\.\d+)?)(\s+)?(?=(\*|\/)))|(\*|\/){1,}(\s+)?|(((\-|\+)+)?(\d+(\.\d+)?))\s?/g);switch(s=this.calcSingOfNumber(s),a.trim()){case"*":t=+i*+s;break;case"/":if(0==+s)throw new CalculationError("Division by zero is undefined");t=+i/+s}return e=this.resultReplace(e,t,r.index,r[0].length),this.mediumPrecedence(e)}lowestPrecedence(e){let t,r;if(!(r=e.match(/(((\-|\+)+)?\d+(\.\d+)?)(\s+)?(\+|\-)+(\s+)?(\d+(\.\d+)?)/)))return e;let[i,a,s]=r[0].match(/((((\-|\+)+)?\d+(\.\d+)?)\s?(?=(\-|\+)))|(\-|\+){1,}\s?|(\d+(\.\d+)?)\s?/g);switch(a=this.calcSign(a),i=this.calcSingOfNumber(i),a.trim()){case"+":t=+i+ +s;break;case"-":t=+i-+s}return e=this.resultReplace(e,t,r.index,r[0].length),this.lowestPrecedence(e)}calcSign(e){return e.length<2?e:e.split("").reduce((e,t)=>0<(e+"1")*(t+"1")?"+":"-")}calcSingOfNumber(e){let t=e.match(/(\d+(\.\d+)?)|(\-|\+)+/g);if(t)return 1!=t.length&&(t[0]=this.calcSign(t[0])),t.join("")}resultReplace(e,t,r,i){return(0==r?"":e.substring(0,r))+t+e.substring(i+r)}}const SelectEl=e=>document.querySelector(e),result_ele=SelectEl(".result__calculation"),calculationInput=SelectEl("#calculation"),variableInput=SelectEl("#variable"),descInput=SelectEl("#note"),errorCalc=SelectEl(".message__input__calculation"),errorVar=SelectEl(".message__variable"),listHistory=SelectEl(".history .list__history"),emptyHistory=SelectEl(".empty__history"),templateHistoryItem=SelectEl("#item__history__template").content,calc=new Calculation,historyLists={};let currentid,currentResult="0",variableExist=!1;function app(){calculationInput.addEventListener("input",calculation_process),variableInput.addEventListener("input",variable_process),SelectEl(".calculator .show-history-mb").addEventListener("click",()=>document.querySelector(".history").classList.add("open__history")),SelectEl(".history .close-history-mb").addEventListener("click",()=>document.querySelector(".history").classList.remove("open__history")),SelectEl(".calculator .btn__save").addEventListener("click",registerItem),SelectEl(".btn__clean").addEventListener("click",resetFrom)}document.addEventListener("DOMContentLoaded",app);let setTimeInputCalculation;function calculation_process({target:e}){const r=e.value;errorCalc.textContent="",clearTimeout(setTimeInputCalculation),setTimeInputCalculation=setTimeout(async()=>{try{var e=await calc.process(r),t=variableInput.value;t&&Calculation.setVar(t,e),result_ele.textContent=currentResult=e||"0"}catch(e){errorCalc.textContent=e.message}},1200)}let setTimeInputVariable;function variable_process({target:e}){let t=e.value;t&&(clearTimeout(setTimeInputVariable),setTimeInputVariable=setTimeout(()=>{errorVar.textContent="";try{if(Calculation.isVarExist(t))throw new Error("The variable exists, try another one");Calculation.setVar(t,currentResult),variableExist=!1,currentid=null}catch(e){variableExist=!0,errorVar.textContent=e.message}},1200))}function registerItem(){currentid=currentid||Math.ceil(100*Math.random())+Date.now(),historyLists[currentid]={result:currentResult??"0",calc:calculationInput.value??"0",desc:descInput.value??"",variable:variableInput.value??""},createHistoryItem(historyLists[currentid],currentid)}function createHistoryItem(t,r){if(""!==calculationInput.value.trim()&&!variableExist){emptyHistory.classList.contains("show__empty__history")&&emptyHistory.classList.remove("show__empty__history");var i=SelectEl(`li[data-id="${r}"]`);let e;i?e=i:((e=templateHistoryItem.cloneNode(!0)).querySelector("li").dataset.id=r,e.querySelector(".btn__edit").addEventListener("click",editCalc),e.querySelector(".btn__del").addEventListener("click",deleteCalc)),e.querySelector(".variable__item").textContent=t.variable+" = ",e.querySelector(".result__item").textContent=t.result,e.querySelector(".note__item__history").textContent=t.desc,listHistory.prepend(e),resetFrom()}}function editCalc({target:e}){e=e.closest(".item__history");currentid=e.dataset.id,initFrom(historyLists[currentid])}function deleteCalc({target:e}){const t=e.closest(".item__history");id=t.dataset.id,delete historyLists[id],t.remove(),Object.keys(historyLists).length<1&&emptyHistory.classList.add("show__empty__history"),resetFrom()}function initFrom(e={}){calculationInput.value=e.calc??"",variableInput.value=e.variable??"",descInput.value=e.desc??"",errorCalc.textContent=e.calcErr??"",errorVar.textContent=e.varErr??"",result_ele.textContent=e.result??"0"}function resetFrom(){initFrom(),currentid=null}