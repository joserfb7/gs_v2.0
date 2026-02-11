const SIDCModel = (() => {

  moverVisualizadorASlotActivo();


  let value = "130310000000000000000000000000";

  function isValid(sidc) {
    return /^[0-9]{30}$/.test(sidc);
  }

  function get() {
    return value;
  }

  function set(newSIDC) {
    if (isValid(newSIDC)) {
      value = newSIDC;
      return true;
    }
    return false;
  }

  function setDigit(pos, digit) {
    if (!isValid(value)) return;
    const arr = value.split("");
    arr[pos] = digit;
    value = arr.join("");
  }

  function setTwoDigits(pos, twoDigits) {
    if (!isValid(value) || twoDigits.length !== 2) return;
    const arr = value.split("");
    arr[pos]     = twoDigits[0];
    arr[pos + 1] = twoDigits[1];
    value = arr.join("");
  }

  function setIcon(iconCode) {
    if (!isValid(value) || iconCode.length !== 6) return;
    const arr = value.split("");
    for (let i = 0; i < 6; i++) {
      arr[10 + i] = iconCode[i];
    }
    value = arr.join("");
  }

  function read(pos, len = 1) {
    return value.substring(pos, pos + len);
  }

  return {
    get,
    set,
    setDigit,
    setTwoDigits,
    setIcon,
    read,
    isValid
  };

})();



const SymbolController = (() => {

  const options = {
    frame: true,
    padding: 20
  };

  const container = document.getElementById("resultado");

  function updateOption(key, value) {
    if (value) options[key] = value;
    else delete options[key];
  }

  function render() {
    const sidc = SIDCModel.get();
    if (!SIDCModel.isValid(sidc)) return;

    try {
      container.classList.remove("fade-in", "fade-out");
      void container.offsetWidth;
      container.classList.add("fade-out");

      setTimeout(() => {
        const symbol = new ms.Symbol(sidc, options);
        container.innerHTML = symbol.asSVG();
        container.classList.remove("fade-out");
        container.classList.add("fade-in");
      }, 150);

    } catch (e) {
      console.error(e);
    }
  }

  return {
    render,
    updateOption
  };

})();



const UIController = (() => {

  const sidcInput = document.getElementById("sidc-input");

  function bindSelect(id, callback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", e => callback(e.target.value));
  }

  function bindInput(id, callback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", e => callback(e.target.value));
  }

  function syncSIDCToUI() {
    sidcInput.value = SIDCModel.get();
  }

  function syncUIFromSIDC() {
    setSelect("context", SIDCModel.read(2));
    setSelect("identity", SIDCModel.read(3));

    const echelon = SIDCModel.read(8, 2);
    if (document.querySelector(`#escalon option[value="${echelon}"]`)) {
      setSelect("escalon", echelon);
      setSelect("amp-r", "");
    } else {
      setSelect("amp-r", echelon);
      setSelect("escalon", "");
    }

    setSelect("icon-selector", SIDCModel.read(10, 6));
  }

  function setSelect(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = el.querySelector(`option[value="${value}"]`) ? value : "";
  }

  function init() {

    bindAmplifiers();

    function setSymbolSetFromTab(tabId) {
      // tab-10 → ["tab-10", "10"]
      const match = tabId.match(/tab-(\d{2})/);
      if (!match) return;

      const setCode = match[1]; // "00", "10", "25", etc.

      // Escribe en posiciones 4 y 5
      SIDCModel.setTwoDigits(4, setCode);

      bindAmplifiers();

      syncSIDCToUI();
      SymbolController.render();
    }


    // SIDC manual
    sidcInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        SIDCModel.set(sidcInput.value.trim());
        syncUIFromSIDC();
        SymbolController.render();
      }
    });

    // CONTEXTO
    bindSelect("context", v => {
      SIDCModel.setDigit(2, v);
      syncSIDCToUI();
      SymbolController.render();
    });

    // IDENTIDAD
    bindSelect("identity", v => {
      SIDCModel.setDigit(3, v);
      syncSIDCToUI();
      SymbolController.render();
    });



    // ICONO
    bindSelect("icon-selector", v => {
      SIDCModel.setIcon(v);
      syncSIDCToUI();
      SymbolController.render();
    });

    // MODIFICADOR 1 (SIDC 16–17)
    bindSelect("modifier-1", v => {
      const activeTab = document.querySelector(".tab-content.active");
      const el = document.getElementById("modifier-1");

      // seguridad: solo si está en la pestaña activa
      if (!activeTab || !activeTab.contains(el)) return;

      updateModifier1(v);
    });

    // MODIFICADOR 2 (SIDC 18–19)
    bindSelect("modifier-2", v => {
      const activeTab = document.querySelector(".tab-content.active");
      const el = document.getElementById("modifier-2");

      // Seguridad: solo si está en la pestaña activa
      if (!activeTab || !activeTab.contains(el)) return;

      updateModifier2(v);
    });


    // J — CALIFICACIÓN DE LA EVALUACIÓN
    bindInput("amp-j-source", updateJ);
    bindInput("amp-j-cred", updateJ);

    function updateJ() {
      const s = document.getElementById("amp-j-source")?.value || "";
      const c = document.getElementById("amp-j-cred")?.value || "";

      SymbolController.updateOption(
        "evaluationRating",
        (s && c) ? (s + c).toUpperCase() : null
      );

      SymbolController.render();
    }

    // F — REFORZADO / REDUCIDO
    bindSelect("amp-f", v => {
      if (v === "none" || v === "") {
        SymbolController.updateOption("reinforcedReduced", null);
      } else {
        SymbolController.updateOption("reinforcedReduced", v);
      }
      SymbolController.render();
    });

    // K — EFICACIA DEL COMBATE
    bindSelect("amp-k", v => {
      if (v === "none" || v === "") {
        SymbolController.updateOption("combatEffectiveness", null);
      } else {
        SymbolController.updateOption("combatEffectiveness", v);
      }
      SymbolController.render();
    });

    /* L — FIRMA ELECTRÓNICA DETECTABLE
    bindSelect("amp-l", v => {
      if (v === "none" || v === "") {
        SymbolController.updateOption("electronicSignature", null);
      } else {
        SymbolController.updateOption("electronicSignature", v);
      }
      SymbolController.render();
    }); */

    // N — EQUIPO ENEMIGO
 /* bindSelect("amp-n", v => {
      if (v === "none" || v === "") {
        SymbolController.updateOption("additionalInformation", null);
      } else {
        const map = {
          armor: "EQ ENE BLINDADO",
          antiArmor: "EQ ENE ANTIBLIND",
          airDefense: "EQ ENE DEF AÉREA",
          artillery: "EQ ENE ARTILLERÍA",
          ew: "EQ ENE EW",
          uav: "EQ ENE UAV",
          ied: "EQ ENE IED",
          missile: "EQ ENE MISILES",
          naval: "EQ ENE NAVAL"
        };

        SymbolController.updateOption("additionalInformation", map[v]);
      }
      SymbolController.render();
    }); */

    // P — PRIORIDAD DE VISUALIZACIÓN
  /*bindSelect("amp-p", v => {
      if (v === "none" || v === "") {
        SymbolController.updateOption("strokeWidth", null);
        SymbolController.updateOption("outlineColor", null);
      } else {
        const map = {
          low:      { strokeWidth: 1, outlineColor: "#777" },
          medium:   { strokeWidth: 2, outlineColor: "#ffa500" },
          high:     { strokeWidth: 3, outlineColor: "#ff0000" },
          critical: { strokeWidth: 4, outlineColor: "#ff00ff" }
        };

        const cfg = map[v];
        SymbolController.updateOption("strokeWidth", cfg.strokeWidth);
        SymbolController.updateOption("outlineColor", cfg.outlineColor);
      }
      SymbolController.render();
    }); */



    document.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("change", SymbolController.render);
      el.addEventListener("input", SymbolController.render);
    });

    // =========================
    // VISUALIZADOR
    // =========================

    const btnVis = document.getElementById("btn-visualizador");
    const modal = document.getElementById("visualizador-modal");
    const modalImg = document.getElementById("modal-img");
    const previewImg = document.getElementById("preview-img");
    const closeBtn = document.getElementById("visualizador-close");

    const visualizadorImgs = {
      "tab-00": "img/default.png",
      "tab-01": "img/aire.png",
      "tab-02": "img/aire-misil.png",
      "tab-05": "img/espacio.png",
      "tab-06": "img/espacio-misil.png",
      "tab-10": "img/unidad de tierra.png",

      default: "img/default.png"
    };

    let pestañaActual = "tab-10";

        function setVisualizador(tab) {
          pestañaActual = tab;
          const img = visualizadorImgs[tab] || visualizadorImgs.default;
          previewImg.src = img;
          modalImg.src = img;
        }

        document.querySelectorAll(".tab").forEach(tabBtn => {
          tabBtn.addEventListener("click", () => {
            const tabId = tabBtn.dataset.tab;

            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            tabBtn.classList.add("active");

            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            const content = document.getElementById(tabId);
            if (content) content.classList.add("active");

            resetearFormulario();

            SIDCModel.set("130310000000000000000000000000");

            setVisualizador(tabId);
            setSymbolSetFromTab(tabId);

            syncSIDCToUI();
            SymbolController.render();
            moverVisualizadorASlotActivo();

            tabBtn.scrollIntoView({
              behavior: "smooth",
              inline: "center",
              block: "nearest"
            });

            [
              "uniqueDesignation",
              "speed",
              "altitudeDepth",
              "location",
              "quantity",
              "direction",
              "staffComments",
              "additionalInformation",
              "evaluationRating",
              "combatEffectiveness",
              "reinforcedReduced",
              "engagementBar",
              "type",
              "dtg",
              "platformType",
              "equipmentTeardownTime",
              "commonIdentifier",
              "higherFormation"

            ].forEach(opt => SymbolController.updateOption(opt, null));

          });
        });


        btnVis?.addEventListener("click", () => modal.style.display = "block");
        closeBtn?.addEventListener("click", () => modal.style.display = "none");
        modal?.addEventListener("click", e => { if(e.target===modal) modal.style.display="none"; });

        

        // Inicializa visualizador con tab-10
        setVisualizador("tab-10");

        // Render inicial
        syncSIDCToUI();
        SymbolController.render();
      }

      return {
        init,
        syncSIDCToUI,  // <-- Añadir esto para que sea accesible desde fuera
        syncUIFromSIDC,
        setSelect
      };
      

      
})();



window.addEventListener("DOMContentLoaded", () => {
  UIController.init();
});


function moverVisualizadorASlotActivo() {
  const slot = document.querySelector(
    ".tab-content.active [data-slot='center']"
  );
  const visualizador = document.getElementById("center-slot");

  if (slot && visualizador && !slot.contains(visualizador)) {
    slot.appendChild(visualizador);
  }
}





function bindAmplifiers() {
  document.addEventListener("input", e => {
    const el = e.target;
    if (!el.dataset.amp) return;

    const activeTab = document.querySelector(".tab-content.active");
    if (!activeTab || !activeTab.contains(el)) return;

    handleAmplifier(el.dataset.amp, el.value);
  });

  document.addEventListener("change", e => {
    const el = e.target;
    if (!el.dataset.amp) return;

    const activeTab = document.querySelector(".tab-content.active");
    if (!activeTab || !activeTab.contains(el)) return;

    handleAmplifier(el.dataset.amp, el.value);
  });
}


function handleAmplifier(code, value) {
  switch (code) {

    case "b": // ESCALÓN
      if (value === "" || value === "none") {
        SIDCModel.setTwoDigits(8, "00");
      } else {
        SIDCModel.setTwoDigits(8, value);
      }

      // 🔁 Reiniciar visualmente R
      resetSelectToPlaceholder("amp-r");

      break;

    case "c":
      SymbolController.updateOption("quantity", value);
      break;

    case "d":
      SIDCModel.setDigit(7, value === "" || value === "none" ? "0" : value);

      resetSelectToPlaceholder("amp-s");
      break;



    case "g":
      SymbolController.updateOption("staffComments", value);
      break;

    case "h":
      SymbolController.updateOption("additionalInformation", value);
      break;

    case "m":
      SymbolController.updateOption("higherFormation", value.trim().toUpperCase());
    break;

    case "q":
      SymbolController.updateOption("direction", value);
      break;

    case "r": // MOVILIDAD
      if (value === "" || value === "none") {
        SIDCModel.setTwoDigits(8, "00");
      } else {
        SIDCModel.setTwoDigits(8, value);
      }

      // 🔁 Reiniciar visualmente B
      resetSelectToPlaceholder("amp-b");

      break;


    case "s":
      SIDCModel.setDigit(7, value === "" || value === "none" ? "0" : value);

      resetSelectToPlaceholder("amp-d");
      break;



    case "t":
      SymbolController.updateOption("uniqueDesignation", value.toUpperCase());
      break;

    case "v":
      SymbolController.updateOption("type", value.trim());
      break;

    case "w":
      SymbolController.updateOption("dtg", value.toUpperCase());
      break;

    case "x":
      SymbolController.updateOption("altitudeDepth", value);
      break;

    case "y":
      SymbolController.updateOption("location", value.toUpperCase());
      break;

    case "z":
      SymbolController.updateOption("speed", value);
      break;

    case "ad":
      SymbolController.updateOption("platformType", value.trim());
      break;

    case "ae":
      SymbolController.updateOption("equipmentTeardownTime", value.trim());
      break;

    case "af":
      SymbolController.updateOption("commonIdentifier", value.trim().toUpperCase());
    break;

    case "al":
      SIDCModel.setDigit(6, value);
      break;

    case "ao":
      SymbolController.updateOption(
        "engagementBar",
        value === "" || value === "none" ? null : value
      );
      break;

    case "m1": // Modificador 1
      if (value === "" || value === "none") {
        SIDCModel.setTwoDigits(16, "00");
      } else {
        SIDCModel.setTwoDigits(16, value);
      }
      break;

    case "m2": // Modificador 2
      if (value === "" || value === "none") {
        SIDCModel.setTwoDigits(18, "00");
      } else {
        SIDCModel.setTwoDigits(18, value);
      }
      break;

    case "icon":
      if (value === "" || value === "none") {
        SIDCModel.setIcon("000000"); // Icono por defecto fijo
      } else {
        SIDCModel.setIcon(value);
      }
      break;
  

  }

  syncSIDCToUI();
  SymbolController.render();
}


function resetearFormulario() {
  // Reiniciar todos los inputs de texto
  document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
    input.value = '';
  });

  // Reiniciar todos los selects a su valor por defecto
  document.querySelectorAll('select').forEach(select => {
    // Intentar establecer valor vacío o "none" si existe
    if (select.querySelector('option[value=""]')) {
      select.value = '';
    } else if (select.querySelector('option[value="none"]')) {
      select.value = 'none';
    } else {
      // Si no hay opción vacía, ir a la primera
      select.selectedIndex = 0;
    }
  });

  // Reiniciar los checkboxes y radios
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
    input.checked = false;
  });
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
  if (!svgElement) {
    alert("No hay símbolo para descargar");
    return;
  }

  const scale = 4;              // 🔹 2 o 4
  const background = "white";   // 🔹 "white" | "transparent"

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8"
  });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width  = img.width  * scale;
    canvas.height = img.height * scale;

    // Fondo blanco
    if (background === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);

    URL.revokeObjectURL(url);

    canvas.toBlob(blob => {
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "simbolo_otan_4x.png";
      a.click();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
  };

  img.src = url;
});

function resetSelectToPlaceholder(id) {
  const el = document.getElementById(id);
  if (!el) return;

  setTimeout(() => {
    el.selectedIndex = 0;
  }, 0);
}


function updateModifier1(value) {
  // Normalizar: quitar espacios
  const v = value.trim();

  // Si está vacío o no es de 2 dígitos → 00
  if (!/^\d{2}$/.test(v)) {
    SIDCModel.setTwoDigits(16, "00");
  } else {
    SIDCModel.setTwoDigits(16, v);
  }

  syncSIDCToUI();
  SymbolController.render();
}


function updateModifier2(value) {
  // Normalizar: quitar espacios
  const v = value.trim();

  // Si está vacío o no es de 2 dígitos → 00
  if (!/^\d{2}$/.test(v)) {
    SIDCModel.setTwoDigits(18, "00");
  } else {
    SIDCModel.setTwoDigits(18, v);
  }

  syncSIDCToUI();
  SymbolController.render();
}
