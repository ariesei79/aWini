// const baseUrlQDB = "/QDB_Last";

// document.getElementById("btnQuality").addEventListener("click", () => {
//   const input = document.getElementById("searchInput").value.trim();

//   if (input.length !== 7 || !/^[1VH]/i.test(input)) {
//     document.getElementById("result2").innerHTML =
//       "Format input tidak valid. Harus 7 karakter dan dimulai dengan 1, V, atau H.";
//     return;
//   }

//   const currentYear = new Date().getFullYear().toString();
//   const yearPrefix = currentYear.slice(0, 3); // Ambil "202"
//   const year = yearPrefix + input[3]; // "202" + "5" → "2025"

//   const rawMonth = input[4];
//   const month = rawMonth.padStart(2, "0");

//   const mesin = input.slice(0, 3).toLowerCase(); // Misal "12b"
//   const tanggalInput = input.slice(-2); // 2 huruf terakhir

//   fetch(`${baseUrlQDB}/search?year=${year}&month=${month}&mesin=${mesin}`)
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error("Gagal mengambil data");
//       }
//       return response.json();
//     })
//     .then((files) => {
//       const resultDiv = document.getElementById("result");
//       resultDiv.innerHTML = "";

//       const groupedByFolder = {};

//       files.forEach((file) => {
//         const match = file.name.match(/(\d{2})\.(tif|tiff|jpg|jpeg|png|gif)$/i);
//         if (!match) return;

//         const fileTanggal = match[1];
//         if (fileTanggal > tanggalInput) return;

//         if (!groupedByFolder[file.folder]) {
//           groupedByFolder[file.folder] = {
//             path: file.path,
//             files: [],
//           };
//         }
//         groupedByFolder[file.folder].files.push(file);
//       });

//       const folderKeys = Object.keys(groupedByFolder);
//       if (folderKeys.length === 0) {
//         resultDiv.innerHTML = "Tidak ada file yang cocok berdasarkan filter tanggal.";
//         return;
//       }

//       folderKeys.forEach((folder) => {
//         const folderData = groupedByFolder[folder];

//         const header = document.createElement("h5");
//         header.textContent = "📁 " + folderData.path;
//         resultDiv.appendChild(header);

//         const list = document.createElement("ul");
//         list.classList.add("list-group", "mb-3");

//         folderData.files.forEach((item) => {
//           const listItem = document.createElement("li");
//           listItem.className =
//             "list-group-item d-flex justify-content-between align-items-center";

//           const nameSpan = document.createElement("span");
//           nameSpan.textContent = item.name;

//           const actionDiv = document.createElement("div");

//           const openLink = document.createElement("a");
//           openLink.href = item.openUrl;
//           openLink.target = "_blank";
//           openLink.textContent = "Lihat";
//           openLink.className = "btn btn-sm btn-outline-primary me-2";

//           const downloadLink = document.createElement("a");
//           downloadLink.href = item.openUrl; // same URL, can add download attr
//           downloadLink.setAttribute("download", item.name);
//           downloadLink.textContent = "Unduh";
//           downloadLink.className = "btn btn-sm btn-outline-success";

//           actionDiv.appendChild(openLink);
//           actionDiv.appendChild(downloadLink);

//           listItem.appendChild(nameSpan);
//           listItem.appendChild(actionDiv);

//           list.appendChild(listItem);
//         });

//         resultDiv.appendChild(list);
//       });
//     })
//     .catch((err) => {
//       document.getElementById("result").innerHTML =
//         "Terjadi kesalahan: " + err.message;
//     });
// });

export async function fetchQualityData(input, resultDivId = "result") {
  const baseUrlQDB = "/QDB_Last";

  if (input.length !== 7 || !/^[1VH]/i.test(input)) {
    document.getElementById("result2").innerHTML =
      "Format input tidak valid. Harus 7 karakter dan dimulai dengan 1, V, atau H.";
    return;
  }

  const currentYear = new Date().getFullYear().toString();
  const yearPrefix = currentYear.slice(0, 3);
  const year = yearPrefix + input[3];
  const rawMonth = input[4];
  const month = rawMonth.padStart(2, "0");
  const mesin = input.slice(0, 3).toLowerCase();
  const tanggalInput = input.slice(-2);
  const tanggalInputNum = parseInt(tanggalInput, 10);

  try {
    const response = await fetch(`${baseUrlQDB}/search?year=${year}&month=${month}&mesin=${mesin}`);
    if (!response.ok) throw new Error("Gagal mengambil data");
    const files = await response.json();

    const resultDiv = document.getElementById(resultDivId);
    resultDiv.innerHTML = "";

    const groupedByFolder = {};

    files.forEach((file) => {
      const prefix7 = file.name.slice(0, 7); // ambil 7 karakter pertama
      const fileTanggal = prefix7.slice(-2); // ambil 2 karakter terakhir dari 7 karakter tadi (string)
    
      // Pastikan fileTanggal adalah angka valid 2 digit
      if (!/^\d{2}$/.test(fileTanggal)) return;
      const fileTanggalNum = parseInt(fileTanggal, 10);
      if (isNaN(fileTanggalNum)) return;
    
      // Filter hanya folder IDS dan Worksheet
      let isValid = false;
      if (file.folder === "ids" || file.folder === "worksheet") {
        // Jika IDS atau Worksheet → ambil yang selisihnya <= 3 hari
        const selisih = Math.abs(fileTanggalNum - tanggalInputNum);
        isValid = selisih <= 3;
      } else {
        // Selain IDS/Worksheet → ambil jika tanggal <= tanggalInput
        isValid = fileTanggalNum <= tanggalInputNum;
      }
    
      if (!isValid) return;
    
     
      // Bandingkan dengan tanggalInput (asumsikan tanggalInput juga string angka 2 digit)
      // if (fileTanggal > tanggalInput) return;
    
      if (!groupedByFolder[file.folder]) {
        groupedByFolder[file.folder] = {
          path: file.path,
          files: [],
        };
      }
       // Simpan juga tanggal sebagai property bantu (opsional)
  file._tanggal2digit = fileTanggal;

      groupedByFolder[file.folder].files.push(file);
    });
    

    const folderKeys = Object.keys(groupedByFolder);
    if (folderKeys.length === 0) {
      resultDiv.innerHTML = "Tidak ada file yang cocok berdasarkan filter tanggal.";
      return;
    }

    folderKeys.forEach((folder) => {
      groupedByFolder[folder].files.sort((a, b) => {
        return b._tanggal2digit - a._tanggal2digit; // descending
      });
      const folderData = groupedByFolder[folder];

      const header = document.createElement("h5");
      header.textContent = "📁 " + folder;
      resultDiv.appendChild(header);

      const list = document.createElement("ul");
      list.classList.add("list-group", "mb-3");

      folderData.files.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = item.name;

        const actionDiv = document.createElement("div");

        const openLink = document.createElement("a");
        openLink.href = item.openUrl;
        openLink.target = "_blank";
        openLink.textContent = "Lihat";
        openLink.className = "btn btn-sm btn-outline-primary me-2";

        const downloadLink = document.createElement("a");
        downloadLink.href = item.openUrl;
        downloadLink.setAttribute("download", item.name);
        downloadLink.textContent = "Unduh";
        downloadLink.className = "btn btn-sm btn-outline-success";

        actionDiv.appendChild(openLink);
        actionDiv.appendChild(downloadLink);
        listItem.appendChild(nameSpan);
        listItem.appendChild(actionDiv);
        list.appendChild(listItem);
      });

      resultDiv.appendChild(list);
    });
  } catch (err) {
    document.getElementById(resultDivId).innerHTML =
      "Terjadi kesalahan: " + err.message;
  }
}
