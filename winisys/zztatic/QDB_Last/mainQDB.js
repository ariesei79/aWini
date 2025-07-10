import { fetchQualityData } from "./scriptQdb.js";
import { performSearch } from "./scriptQdb2.js";

document.getElementById("btnQuality").addEventListener("click", async () => {
  const input = document.getElementById("searchInput").value.trim();
  await fetchQualityData(input);
  await performSearch();
});
