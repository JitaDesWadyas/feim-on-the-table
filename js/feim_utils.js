export const q = s => document.querySelector(s);
export const qq = s => document.querySelectorAll(s);
export function setVal(el, val){
  el.value = val;
  el.dispatchEvent(new Event('input'));
}
