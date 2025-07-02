export function updateTitle() {
  let mesin = document.getElementById("mesin").value
  document.getElementById("title").innerText = "Daily Check Drawing Section - MC " + mesin
}
export function createSelectElement(worksheetNames, containerId) {
  document.getElementById(containerId).innerHTML = ""
  let selectHTML = "<select id='mesin' name='mesin'>"
  selectHTML += "<option value='' disabled selected>Mesin</option>"
  worksheetNames.map((mesin) => {
    selectHTML += `<option value='${mesin}'>${mesin}</option>`
  })
  selectHTML += "</select>"
  document.getElementById(containerId).innerHTML += selectHTML
}

export function createSelectElement2(monthArray, containerId) {
  document.getElementById(containerId).innerHTML = ""
  let selectHTML2 = "<select id='month' name='month'>"
  selectHTML2 += "<option value='' disabled selected>Month</option>"
  monthArray.map((month) => {
    selectHTML2 += `<option value='${month}'>${month}</option>`
  })
  selectHTML2 += "</select>"
  document.getElementById(containerId).innerHTML += selectHTML2
}

export function extractColumnHeaders(worksheet) {
  // Dapatkan range dari worksheet
  const range = XLSX.utils.decode_range(worksheet["!ref"])

  let namacontain = []
  for (let C = range.s.c; C <= range.e.c; ++C) {
    // Dapatkan sel header untuk kolom ini
    const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })]

    // Jika sel ada, tambahkan ke array headers
    if (cell && cell.t) namacontain.push(XLSX.utils.format_cell(cell))
  }
  return namacontain
}

export async function processData(data, selectedmc, selectmonth, item_nama) {
  let filteredProducts = {}
  filteredProducts = data[selectedmc].filter((product) => {
    return selectmonth === "" || product.Month === selectmonth
  })

  // Buat objek baru untuk menyimpan array baru
  let itemArrays = {}

  // Lakukan loop pada array item_nama
  item_nama.forEach((item) => {
    // Buat array baru untuk setiap item berdasarkan filteredProducts
    itemArrays[item] = filteredProducts.map((product) => product[item])
  })
  // console.log(itemArrays["pH"]);
  // Kembalikan itemArrays bukan filteredProducts
  return itemArrays
}

export function createPlotData(x, y, name, color, dash, width, text) {
  return {
    x: x,
    y: y,
    mode: "lines+text",
    hoverinfo: "text",
    type: "line",
    name: name,
    orientation: "v",
    marker: { color: color },
    text: text,
    textposition: "top", // posisi teks
    textfont: { color: "black", size: 12, family: "Calibri" },
    line: {
      dash: dash, // jenis garis putus-putus
      width: width, // ketebalan garis
    },
    showlegend: true,
  }
}

export function createPlotData2(x, y, name, color, dash, width, text, secondaryValue) {
  return {
    x: x,
    y: y,
    mode: "bar+text",
    hoverinfo: "text",
    // hovertemplate: "Primary: %{y}<br>Secondary: %{secondaryValue}<extra></extra>",
    type: "bar",
    name: name,
    orientation: "v",
    marker: { color: color },
    text: text,
    textposition: "inside", // posisi teks
    textfont: { color: "black", size: 12, family: "Calibri" },
    line: {
      dash: dash, // jenis garis putus-putus
      width: width, // ketebalan garis
    },
    showlegend: true,
  }
}

export function createLayoutConfig(yMin, yMax, interval) {
  let screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
  let layoutWidth = screenWidth / 2 // for 2 layouts in one row
  let layout = {
    legend: {
      orientation: "h", // Horizontal legend
      xanchor: "left", // Left alignment
      yanchor: "top", // Top alignment
      font: {
        size: 12,
        color: "black",
      },
    },

    xaxis: {
      range: [0, 31],
      tickmode: "linear",
      dtick: 1,
      tickangle: 0,
      tickfont: {
        size: 11.5,
        color: "black",
        family: "Consolas",
      },
    },
    yaxis: {
      range: [yMin, yMax],
      // autorange: true,
      //tickmode: "linear",
      dtick: interval,
      tickfont: {
        size: 11.5,
        color: "black",
        family: "Consolas",
      },
    },
    width: layoutWidth,
    height: 400,
  }

  var layout2 = {
    xaxis: {
      range: [0, 31],
      title: {
        text: "Date", // Menambahkan baris ini
        standoff: 0.75, // Menambahkan baris ini
        font: {
          // Menambahkan baris ini
          size: 10, // Menambahkan baris ini
        }, // Menambahkan baris ini
      },
      tickmode: "linear",
      dtick: 1,
      tickfont: {
        size: 11.5,
        color: "black",
        family: "Consolas",
      },
    },
    legend: {
      orientation: "h", // Horizontal legend
      xanchor: "left", // Left alignment
      yanchor: "top", // Top alignment
      font: {
        size: 12,
        color: "black",
      },
    },

    yaxis: {
      range: [0, "auto"],
      //tickmode: "linear",
      //dtick: 1,
      tickfont: {
        size: 11.5,
        color: "black",
        family: "Consolas",
      },
    },
    yaxis2: {
      overlaying: "y",
      side: "right",
    },
    width: layoutWidth,
    height: 400,
  }
  let config = { displayModeBar: false }

  return { layout, layout2, config }
}

export function oil(value) {
  let v_oIl = createPlotData(value["Date"], value["Oil"], "Oil", "blue", "solid", 1.0, value["Oil"])
  let v_oIl_min = createPlotData(value["Date"], value["Oil_Min"], "Oil_min", "red", "dash", 0.85)
  let v_oIl_max = createPlotData(value["Date"], value["Oil_Max"], "Oil_max", "red", "dash", 0.85)
  let v_oIl_target = createPlotData(value["Date"], value["Oil_Target"], "Oil_target", "red", "dash", 0.5)
  let oil = [v_oIl, v_oIl_min, v_oIl_max, v_oIl_target]
  return oil
}

export function pH(value) {
  let v_pH = createPlotData(value["Date"], value["pH"], "pH", "blue", "solid", 1.0, value["pH"])
  let v_pH_min = createPlotData(value["Date"], value["pH_Min"], "pH_min = 7.5", "red", "dash", 0.85)
  let pHData = [v_pH, v_pH_min]
  return pHData
}

export function vOl(value) {
  let v_vOl = createPlotData(value["Date"], value["Volume"], "Vol", "blue", "solid", 1.0, value["Volume"])
  let v_vOl_min = createPlotData(value["Date"], value["Vol_Min"], "Vol_Min", "red", "dash", 0.85)
  let v_vOl_max = createPlotData(value["Date"], value["Vol_Max"], "Vol_Max", "red", "dash", 0.85)
  let vOlData = [v_vOl, v_vOl_min, v_vOl_max]
  return vOlData
}

export function tEmp(value) {
  let v_tEmp = createPlotData(value["Date"], value["Temperature"], "Temperature(°C)", "blue", "solid", 1.0, value["Temperature"])
  let v_tEmp_min = createPlotData(value["Date"], value["Temp_Min"], "Temp_Min", "red", "dash", 0.85)
  let v_tEmp_max = createPlotData(value["Date"], value["Temp_Max"], "Temp_Max", "red", "dash", 0.85)
  let tEmpData = [v_tEmp, v_tEmp_min, v_tEmp_max]
  return tEmpData
}

export function cOnd(value) {
  let conductivity_data = value["Conductivity"]
  let result3 = []
  for (let element of conductivity_data) {
    result3.push(element / 1000)
  }

  let v_cOnd = createPlotData(value["Date"], value["Conductivity"], "Conductivity(us x 1000)", "blue", "solid", 1.0, result3)
  let v_cOnd_target = createPlotData(value["Date"], value["Conductivity_Target"], "Conductivity_Target", "green", "dash", 0.85)
  let v_cOnd_max = createPlotData(value["Date"], value["Conductivity_Max"], "Conductivity_Max", "red", "dash", 0.85)
  let cOndData = [v_cOnd, v_cOnd_target, v_cOnd_max]
  return cOndData
}

export function pRod(value) {
  let qty = value["Qty_Prod"]
  let scrap = value["Scrap"]
  let result = []

  let result2 = qty.map((item, index) => {
    return item / scrap[index]
  })

  // Divide each element in qty by 1000 and push to the result array
  for (let element of qty) {
    result.push(element / 1000)
  }
  let v_prod = createPlotData2(value["Date"], result, "Qty_Production(Ton)", "blue", "solid", 0.85, result, scrap)
  let v_scrap = createPlotData2(value["Date"], scrap, "Qty_Scrap(Kg)", "red", "solid", 0.85, scrap)
  let prodData = [v_prod, v_scrap]
  return prodData
}

export function Util(value) {
  let running = value["Running_Hours"]
  let result = []
  // // Divide each element in qty by 1000 and push to the result array
  for (let element of running) {
    let decimalValue = (element * 100) / 24
    result.push(decimalValue.toFixed(1))
  }

  let v_utilytize = createPlotData(value["Date"], result, "Utilizations (%)", "red", "solid", 0.85, result)
  let prodData = [v_utilytize]
  return prodData
}

export function Eff(value) {
  let eff = value["Eff"]
  let result = []

  for (let element of eff) {
    let decimalValue = (element * 1) / 1
    result.push(decimalValue.toFixed(1))
  }

  let v_eff = createPlotData(value["Date"], eff, "Efficiency (%)", "blue", "solid", 0.85, result)
  let prodData = [v_eff]
  return prodData
}
