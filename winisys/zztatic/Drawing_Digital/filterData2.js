import { createLayoutConfig, oil, pH, vOl, tEmp, cOnd, pRod, Eff, Util } from "./plotly.js"

window.onload = function () {
  // Function to create select element for mesin
  function createSelectElement(worksheetNames, containerId) {
    const container = document.getElementById(containerId)
    container.innerHTML = ""
    let selectHTML = "<select id='mesin' name='mesin'>"
    selectHTML += "<option value='' disabled selected>Mesin</option>"
    worksheetNames.forEach((mesin) => {
      selectHTML += `<option value='${mesin}'>${mesin}</option>`
    })
    selectHTML += "</select>"
    container.innerHTML = selectHTML
    console.log("Mesin Select Element Created:") // Debugging
  }

  // Function to create select element for month
  function createSelectElement2(monthArray, containerId) {
    const container = document.getElementById(containerId)
    container.innerHTML = ""
    let selectHTML2 = "<select id='month' name='month'>"
    selectHTML2 += "<option value='' disabled selected>Month</option>"
    monthArray.forEach((month) => {
      selectHTML2 += `<option value='${month}'>${month}</option>`
    })
    selectHTML2 += "</select>"
    container.innerHTML = selectHTML2
    console.log("Month Select Element Created:") // Debugging
  }

  // Function to extract column headers from worksheet
  function extractColumnHeaders(worksheet) {
    const range = XLSX.utils.decode_range(worksheet["!ref"])
    let namacontain = []
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })]
      if (cell && cell.t) namacontain.push(XLSX.utils.format_cell(cell))
    }
    return namacontain
  }

  // Function to handle file change
  const handleFileChange = function (evt) {
    return new Promise((resolve) => {
      const file = evt.target.files[0]
      const reader = new FileReader()
      reader.onload = async function (e) {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })

        let jsonData = {}
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          jsonData[sheetName] = XLSX.utils.sheet_to_json(worksheet)
        })

        const worksheetNames = workbook.SheetNames
        console.log("Worksheet Names:", worksheetNames) // Debugging

        const worksheet1 = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData2 = XLSX.utils.sheet_to_json(worksheet1, { header: 1 })
        const monthSet = new Set()
        for (let i = 1; i < jsonData2.length; i++) {
          monthSet.add(jsonData2[i][1])
        }
        const monthArray = Array.from(monthSet)
        console.log("Month Array:", monthArray) // Debugging

        createSelectElement(worksheetNames, "container1")
        createSelectElement2(monthArray, "container2")
        const itemcheck = extractColumnHeaders(worksheet1)

        resolve({ jsonData, monthArray, itemcheck })
      }
      reader.readAsArrayBuffer(file)
    })
  }

  // Function to process data
  function processData(data, selectedmc, selectmonth, item_nama) {
    let filteredProducts = data[selectedmc].filter((product) => {
      return selectmonth === "" || product.Month === selectmonth
    })

    let itemArrays = {}
    item_nama.forEach((item) => {
      itemArrays[item] = filteredProducts.map((product) => product[item])
    })
    return itemArrays
  }

  // Handle file input change
  let fileLoaded = new Promise((resolve) => {
    let fileInput = document.getElementById("excel-file")
    fileInput.addEventListener("change", (event) => {
      let data = handleFileChange(event)
      fileInput.disabled = true
      resolve(data)
    })
  })

  // Process data based on selected mesin and month
  fileLoaded.then((result) => {
    const jsonData = result.jsonData
    const itemname = result.itemcheck

    let mesinElement = document.getElementById("mesin")
    let monthElement = document.getElementById("month")

    console.log("Loaded JSON Data:", jsonData) // Debugging: Check loaded data

    const updateAndProcess = async () => {
      let selectedmc = mesinElement.value
      let selectmonth = monthElement.value

      if (!selectedmc) {
        alert("Please select a Mesin (machine).")
        return
      }

      console.log("Selected Mesin:", selectedmc) // Log selected mesin
      console.log("Selected Month:", selectmonth) // Log selected month

      if (selectedmc && selectmonth) {
        let dataSiapuntukchart = await processData(jsonData, selectedmc, selectmonth, itemname)
        console.table(dataSiapuntukchart) // Log filtered data

        if (!dataSiapuntukchart || dataSiapuntukchart.length === 0) {
          console.log("No data available for the selected Mesin and Month.") // Debugging: No data case
          return
        }

        let y_oilMin, y_oilMax, oil_interval, y_qtyMin, y_qtyMax, vol_interval
        if (selectedmc === "ALine") {
          y_oilMin = 6
          y_oilMax = 11
          oil_interval = 1
          y_qtyMin = 3
          y_qtyMax = 8
          vol_interval = 1
        } else if (selectedmc === "BLine") {
          y_oilMin = 3
          y_oilMax = 7
          oil_interval = 1
          y_qtyMin = 0.5
          y_qtyMax = 1.5
          vol_interval = 0.3
        } else {
          y_oilMin = 8
          y_oilMax = 18
          oil_interval = 2
          y_qtyMin = 3.2
          y_qtyMax = 4.9
          vol_interval = 0.5
        }

        // Call the oil function after data is ready
        let oilData = oil(dataSiapuntukchart)
        let pHData = pH(dataSiapuntukchart)
        let VolData = vOl(dataSiapuntukchart)
        let tempData = tEmp(dataSiapuntukchart)
        let cOndData = cOnd(dataSiapuntukchart)
        let pRoductionData = pRod(dataSiapuntukchart)
        let Effisiency = Eff(dataSiapuntukchart)
        let Utilization = Util(dataSiapuntukchart)
        //console.log("Oil Data:", oilData) // Debugging: Check oil data

        let { layout: oilLayout, layout2, config } = createLayoutConfig(y_oilMin, y_oilMax, oil_interval)
        let { layout: pHLayout } = createLayoutConfig(6.5, 9.5, 1)
        let { layout: vOlLayout } = createLayoutConfig(y_qtyMin, y_qtyMax, vol_interval)
        let { layout: tEmpLayout } = createLayoutConfig(33, 44, 2)
        let { layout: condLayout } = createLayoutConfig(500, 6100, 500)
        let { layout: effLayout } = createLayoutConfig(80, 110, 2)
        let { layout: utilLayout } = createLayoutConfig(0, 100, 10)

        Plotly.newPlot("chart", oilData, { ...oilLayout, title: "Oil% - Lubricant", pad: { t: 1, b: 1 }, font: { size: 18 } }, config)
        Plotly.newPlot("chart2", pHData, { ...pHLayout, title: "pH - Lubricant", pad: { t: 1, b: 1 }, font: { size: 18 } }, config)
        Plotly.newPlot("chart3", VolData, { ...vOlLayout, title: "Volume(Ton) - Lubricant", pad: { t: 1, b: 1 }, font: { size: 18 } }, config)
        Plotly.newPlot("chart4", tempData, { ...tEmpLayout, title: "Temperature(°C) - Lubricant", pad: { t: 1, b: 1 }, font: { size: 18 } }, config)
        Plotly.newPlot("chart5", cOndData, { ...condLayout, title: "Conductivity(us) - Lubricant", pad: { t: 1, b: 1 }, font: { size: 18 } }, config)
        Plotly.newPlot("chart6", pRoductionData, { ...layout2, title: "Qty_Production(Ton) & Scrap(Kg)", pad: { t: 1, b: 1 }, font: { size: 18 } }, config)
        Plotly.newPlot("chart7", Effisiency, { ...effLayout, title: "Effisiency(%)", pad: { t: 1, b: 1 }, font: { size: 18 } }, config)
        Plotly.newPlot("chart8", Utilization, { ...utilLayout, title: "Utilyzations (%)", pad: { t: 1, b: 1 }, font: { size: 18 } }, config)
      } else {
        console.log("Please select both Mesin and Month.") // Log message if values are not set
      }
    }

    mesinElement.addEventListener("change", updateAndProcess)
    monthElement.addEventListener("change", updateAndProcess)
  })
}
