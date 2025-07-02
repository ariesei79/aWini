document.getElementById('searchButton').addEventListener('click', function () {
    const query = document.getElementById('searchInput').value;
  
    if (!query) {
      alert('Masukkan kata kunci pencarian!');
      return;
    }
  
    fetch('/search?query=yourSearchTerm')
   .then(response => response.json())
   .then(data => {
       const resultsContainer = document.getElementById('results');
       resultsContainer.innerHTML = ''; // Clear previous results
       
       data.forEach(filePath => {
           const anchor = document.createElement('a');
           anchor.href = filePath; // Gunakan URL yang disediakan oleh server
           anchor.target = '_blank'; // Buka di tab baru
           anchor.innerText = filePath; // Menampilkan nama file
           resultsContainer.appendChild(anchor);
           resultsContainer.appendChild(document.createElement('br')); // Tambahkan baris baru
       });
   })
   .catch(error => console.error('Error:', error));