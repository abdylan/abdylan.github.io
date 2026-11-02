/* Offline language switching. Media loads only through native controls. */
(function(){"use strict";var lang="en",button=document.getElementById("language-toggle");
function setLanguage(next){lang=next;document.documentElement.lang=lang;document.documentElement.dir=lang==="ur"?"rtl":"ltr";Array.prototype.forEach.call(document.querySelectorAll("[data-en]"),function(el){el.textContent=el.getAttribute("data-"+lang);});button.textContent=lang==="en"?"اردو":"English";button.setAttribute("aria-label",lang==="en"?"Switch to Urdu":"Switch to English");}
button.addEventListener("click",function(){setLanguage(lang==="en"?"ur":"en");});
var players=Array.prototype.slice.call(document.querySelectorAll("video,audio"));players.forEach(function(player){player.addEventListener("play",function(){players.forEach(function(other){if(other!==player)other.pause();});});});setLanguage("en");}());
