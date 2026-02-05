// Referencia global al input SIDC
let symbolOptions = {};


let sidcInput;

window.addEventListener("DOMContentLoaded", () => {

  // Elementos del DOM (se buscan UNA sola vez)
  sidcInput = document.getElementById("sidc-input");
  const contextSelect = document.getElementById("context");
  const identitySelect = document.getElementById("identity");
  const symbolSetSelect = document.getElementById("symbol-set");
  const statusSelect = document.getElementById("status");
  const hqSelect = document.getElementById("hq");
  const echelonSelect = document.getElementById("echelon");  
  const mobilitySelect = document.getElementById("mobility");

  const iconSelect = document.getElementById("icon-selector");

  iconSelect.addEventListener("change", () => {
    const iconCode = iconSelect.value;
    if (!iconCode || iconCode.length !== 6) return;

    actualizarIconoSIDC(iconCode);
  });




  // SIDC por defecto al iniciar
  sidcInput.value = "130310000000000000000000000000";

  // Enter manual en SIDC
  sidcInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      dibujarSIDC();
    }
  });

  // Contexto → 3er dígito (posición 2)
  contextSelect.addEventListener("change", () => {
    actualizarDigitoSIDC(2, contextSelect.value);
  });

  // Identidad → 4º dígito (posición 3)
  identitySelect.addEventListener("change", () => {
    actualizarDigitoSIDC(3, identitySelect.value);
  });

  // Conjunto de símbolos → dígitos 4 y 5 (posiciones 3 y 4)
  symbolSetSelect.addEventListener("change", () => {
    actualizarDosDigitosSIDC(4, symbolSetSelect.value);
  });

  // Estatus → 7º dígito (posición 6)
  statusSelect.addEventListener("change", () => {
    actualizarDigitoSIDC(6, statusSelect.value);
  });

  // Cuartel General / Grupo Operativo → 8º dígito (posición 7)
  hqSelect.addEventListener("change", () => {
    actualizarDigitoSIDC(7, hqSelect.value);
  });

  // Escalón (Amplificadores) → dígitos 9 y 10 (posiciones 8 y 9)
  echelonSelect.addEventListener("change", () => {
    mobilitySelect.value = "";    
    actualizarDosDigitosSIDC(8, echelonSelect.value);
  });

  // Movilidad del equipo en tierra → dígitos 9 y 10 (8 y 9)
  mobilitySelect.addEventListener("change", () => {
    echelonSelect.value = "";
    actualizarDosDigitosSIDC(8, mobilitySelect.value);
  });



  // Dibujar símbolo inicial
  dibujarSIDC();
});

document.getElementById("btn-agregar").addEventListener("click", () => {

  symbolOptions = {
    size: 100,
    frame: true,
    padding: 20
  };


  

  // W – Fecha / Hora
  const w = document.getElementById("amp-w")?.value.trim();
  if (w) symbolOptions.dtg = w.toUpperCase();

  // X – Altitud / profundidad
  const x = document.getElementById("amp-x")?.value.trim();
  if (x) symbolOptions.altitudeDepth = x;

  // Y – Ubicación
  const y = document.getElementById("amp-y")?.value.trim();
  if (y) symbolOptions.location = y.toUpperCase();

  // V – Tipo de equipo
  const v = document.getElementById("amp-v")?.value.trim();
  if (v) symbolOptions.type = v.toUpperCase();

  // AD – Plataforma
  const ad = document.getElementById("amp-ad")?.value.trim();
  if (ad) symbolOptions.platformType = ad.toUpperCase();

  // AE – Tiempo desmontaje
  const ae = document.getElementById("amp-ae")?.value.trim();
  if (ae) symbolOptions.equipmentTeardownTime = ae;

  // T – Designación única (AMPLIFICADOR CLAVE)
  const t = document.getElementById("amp-t")?.value.trim();
  if (t) symbolOptions.uniqueDesignation = t.toUpperCase();

  // Z – Velocidad
  const z = document.getElementById("amp-z")?.value.trim();
  if (z) symbolOptions.speed = z;

  // G – Comentarios del personal
  const g = document.getElementById("amp-g")?.value.trim();
  if (g) symbolOptions.staffComments = g.toUpperCase();

  // H – Información adicional
  const h = document.getElementById("amp-h")?.value.trim();
  if (h) symbolOptions.additionalInformation = h.toUpperCase();

  // AF – Identificador común
  const af = document.getElementById("amp-af")?.value.trim();
  if (af) symbolOptions.commonIdentifier = af.toUpperCase();

  // M – Formación superior
  const m = document.getElementById("amp-m")?.value.trim();
  if (m) symbolOptions.higherFormation = m.toUpperCase();

  // F – Reforzado / reducido
  const f = document.getElementById("amp-f")?.value;
  if (f) symbolOptions.reinforcedReduced = f;

  // J – Evaluación
  const j = document.getElementById("amp-j")?.value;
  if (j) symbolOptions.evaluationRating = j;

  // K – Eficacia combate
  const k = document.getElementById("amp-k")?.value;
  if (k) symbolOptions.combatEffectiveness = k;

  // L – Firma electrónica
  const l = document.getElementById("amp-l")?.value;
  if (l) symbolOptions.signatureEquipment = l;

  // N – Equipo enemigo
  const n = document.getElementById("amp-n")?.value;
  if (n) symbolOptions.hostile = n;

  // P – Prioridad visualización
  const p = document.getElementById("amp-p")?.value;
  if (p) symbolOptions.iffSif = p;

  console.log("symbolOptions final:", symbolOptions);

  dibujarSIDC();
});







/* ===============================
   MODIFICAR UN DÍGITO DEL SIDC
================================ */
function actualizarDigitoSIDC(posicion, nuevoValor) {
  let sidc = sidcInput.value.trim();

  // seguridad: SIDC siempre de 30 dígitos
  if (!/^[0-9]{30}$/.test(sidc)) return;

  let sidcArray = sidc.split("");
  sidcArray[posicion] = nuevoValor;

  sidcInput.value = sidcArray.join("");

  dibujarSIDC();
}






/* ===============================
   MODIFICAR DOS DÍGITOS DEL SIDC
================================ */
function actualizarDosDigitosSIDC(posicion, valor2Digitos) {
  let sidc = sidcInput.value.trim();

  if (!/^[0-9]{30}$/.test(sidc)) return;

  let sidcArray = sidc.split("");
  sidcArray[posicion] = valor2Digitos[0];
  sidcArray[posicion + 1] = valor2Digitos[1];

  sidcInput.value = sidcArray.join("");

  dibujarSIDC();
}






/* ===============================
   DIBUJAR DESDE SIDC
================================ */
function dibujarSIDC() {
  const sidc = sidcInput.value.trim();
  const contenedor = document.getElementById("resultado");

  if (!/^[0-9]{30}$/.test(sidc)) return;

  try {
    // 1️⃣ Reset completo de animación
    contenedor.classList.remove("fade-in", "fade-out");

    // ⚠️ Forzar reflow (clave)
    void contenedor.offsetWidth;

    // 2️⃣ Fade-out
    contenedor.classList.add("fade-out");

    setTimeout(() => {

      

      // ✅ Crear símbolo con SIDC + amplificadores
      const symbol = new ms.Symbol(sidc, symbolOptions);
      
      



      // 3️⃣ Reemplazar SVG
      contenedor.innerHTML = symbol.asSVG();

      // 4️⃣ Fade-in
      contenedor.classList.remove("fade-out");
      contenedor.classList.add("fade-in");

    }, 200);

  } catch (error) {
    console.error(error);
    alert("El SIDC es válido, pero no pudo ser interpretado por milsymbol");
  }
}







document.getElementById("download-svg").addEventListener("click", () => {
  const svgElement = document.querySelector("#resultado svg");
  if (!svgElement) return alert("No hay símbolo para descargar");

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "simbolo_otan.svg";
  a.click();

  URL.revokeObjectURL(url);
});


document.getElementById("download-png").addEventListener("click", () => {
  const svgElement = document.querySelector("#resultado svg");
  if (!svgElement) return alert("No hay símbolo para descargar");

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    URL.revokeObjectURL(url);

    canvas.toBlob(blob => {
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "simbolo_otan.png";
      a.click();
      URL.revokeObjectURL(pngUrl);
    });
  };

  img.src = url;
});









function autoResizeSelectText(select, {
  maxFont = 17,
  minFont = 12,
  padding = 30
} = {}) {

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const style = window.getComputedStyle(select);
  const fontFamily = style.fontFamily;
  const maxWidth = select.clientWidth - padding;

  let fontSize = maxFont;
  const text = select.options[select.selectedIndex]?.text || "";

  while (fontSize >= minFont) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(text).width;

    if (textWidth <= maxWidth) break;
    fontSize--;
  }

  select.style.fontSize = fontSize + "px";
}

/* Aplica SOLO a los selects de la columna derecha */
document.querySelectorAll(".right-column select").forEach(select => {

  // al cargar
  autoResizeSelectText(select);

  // al cambiar opción
  select.addEventListener("change", () => {
    autoResizeSelectText(select);
  });
});





document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {

    document.querySelectorAll(".tab").forEach(t =>
      t.classList.remove("active")
    );

    document.querySelectorAll(".tab-content").forEach(c =>
      c.classList.remove("active")
    );

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

function actualizarIconoSIDC(iconCode) {
  let sidc = sidcInput.value.trim();
  if (!/^[0-9]{30}$/.test(sidc)) return;

  let sidcArray = sidc.split("");

  // Icono funcional: posiciones 10 a 15
  for (let i = 0; i < 6; i++) {
    sidcArray[10 + i] = iconCode[i];
  }

  sidcInput.value = sidcArray.join("");
  dibujarSIDC();
}
