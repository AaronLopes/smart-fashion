// Main entry point
(async function init() {
  const materialsSection = getMaterialsSection();
  const badge = createBadge();
  let displayContainer = null;

  badge.addEventListener("click", () => {
    console.log("Badge clicked");
    if (displayContainer) {
      displayContainer.style.display =
        displayContainer.style.display === "none" ? "block" : "none";
    }
  });

  if (materialsSection) {
    const materialsData = extractMaterialsData(materialsSection);
    const enrichedMaterialsData = await enrichWithClimateImpact(materialsData);
    console.log("Enriched Materials Data:", enrichedMaterialsData);

    // Create initial container with loading indicator
    displayContainer = createMaterialsContainer(
      enrichedMaterialsData,
      null,
      true
    );
    styleOverlay(displayContainer);
    document.body.appendChild(displayContainer);

    const itemTitle = getItemTitle();
    const itemPrice = getItemPrice();
    const searchResults = await searchAlternatives(itemTitle, itemPrice);
    console.log("Search Results:", searchResults);

    // Update the existing container with results
    displayContainer.innerHTML = "";
    await populateMaterialsContainer(
      displayContainer,
      enrichedMaterialsData,
      searchResults,
      false
    );
  } else {
    console.error("Materials section not found.");
  }
})();

async function populateMaterialsContainer(
  container,
  materialsData,
  searchResults,
  isLoading
) {
  const title = document.createElement("h2");
  title.textContent = "Textile Climate Impact";
  container.appendChild(title);

  const scrollableContent = document.createElement("div");
  styleScrollableContent(scrollableContent);

  // Fetch rank data
  const materials = materialsData.map((m) => m.description).join(", ");
  console.log("Materials:", materials);
  const url = window.location.href;
  const rankData = await fetchMaterialsRank(materials, url);

  if (rankData) {
    const rankInfo = document.createElement("div");
    rankInfo.innerHTML = `
      <h3>Sustainability Rank: ${rankData.rank}</h3>
      <p>Analysis: ${rankData.analysis}</p>
    `;
    scrollableContent.appendChild(rankInfo);
  } else {
    // Fallback to displaying materials if rank fetch fails
    materialsData.forEach((material) => {
      if (!material.heading && material.description) {
        material.heading = "Materials:";
      }
      if (material.heading && material.description) {
        const materialItem = document.createElement("p");
        materialItem.innerHTML = `
        <strong>${material.heading}</strong> ${material.description} <br>
        <em>Impact: ${material.impact}</em>
      `;
        scrollableContent.appendChild(materialItem);
      }
    });
  }

  const alternativesTitle = document.createElement("h3");
  alternativesTitle.textContent = "Recommended Alternatives";
  scrollableContent.appendChild(alternativesTitle);

  if (isLoading) {
    scrollableContent.appendChild(createLoadingIndicator());
  } else if (
    searchResults &&
    searchResults.results &&
    searchResults.results.length > 0
  ) {
    const alternativesInfo = document.createElement("p");
    alternativesInfo.textContent = `Found ${searchResults.total_items} items, ${searchResults.matched_items} within price range.`;
    scrollableContent.appendChild(alternativesInfo);

    searchResults.results.forEach((result) => {
      const altItem = document.createElement("div");
      altItem.className = "alternative-item";
      altItem.innerHTML = `
        <h4>${result.item.title}</h4>
        <p>${result.item.snippet}</p>
        <p>Price: $${result.scraped_price.toFixed(2)}</p>
        <p>Price Difference: $${result.price_difference.toFixed(2)}</p>
        <a href="${result.item.link}" target="_blank">View Item</a>
      `;
      if (
        result.item.pagemap &&
        result.item.pagemap.cse_image &&
        result.item.pagemap.cse_image[0].src
      ) {
        const img = document.createElement("img");
        img.src = result.item.pagemap.cse_image[0].src;
        img.alt = result.item.title;
        img.style.maxWidth = "100px";
        img.style.maxHeight = "100px";
        altItem.insertBefore(img, altItem.firstChild);
      }
      styleAlternativeItem(altItem);
      scrollableContent.appendChild(altItem);
    });
  } else {
    const noAlternatives = document.createElement("p");
    noAlternatives.textContent = "No alternatives found.";
    scrollableContent.appendChild(noAlternatives);
  }

  container.appendChild(scrollableContent);
}

function createMaterialsContainer(materialsData, searchResults, isLoading) {
  const container = document.createElement("div");
  container.id = "smart-fashion-overlay";
  populateMaterialsContainer(
    container,
    materialsData,
    searchResults,
    isLoading
  );
  return container;
}

function getItemPrice() {
  const priceElement = document.querySelector("span.edbe20.ac3d9e.d9ca8b");
  if (priceElement) {
    const priceText = priceElement.textContent.trim().replace(/[^0-9.]/g, "");
    const price = parseFloat(priceText);
    console.log("Item Price:", price);
    return price;
  } else {
    console.error("Price element not found.");
    return null;
  }
}

function getItemTitle() {
  const titleElement = document.querySelector("h1.fa226d.af6753.d582fb");
  if (titleElement) {
    const titleText = titleElement.textContent.trim();
    console.log("Item Title:", titleText);
    return titleText;
  } else {
    console.error("Title element not found.");
    return null;
  }
}

function getMaterialsSection() {
  return document.querySelector("#section-materialsAndSuppliersAccordion");
}

function extractMaterialsData(section) {
  const listItems = section.querySelectorAll("li");
  return Array.from(listItems).map((item) => {
    const heading = item.querySelector("h4")?.textContent.trim() || "";
    const description = item.querySelector("p")?.textContent.trim() || "";
    return { heading, description };
  });
}

// Async function to enrich material data with climate impact information
async function enrichWithClimateImpact(materials) {
  try {
    const responses = await Promise.all(
      materials.map(async (material) => {
        const impact = await fetchClimateImpact(material.description);
        return { ...material, impact };
      })
    );
    return responses;
  } catch (error) {
    console.error("Error fetching climate impact data:", error);
    return materials; // Return original data if API call fails
  }
}

// Updated function to fetch climate impact based on multiple material matches
async function fetchClimateImpact(materialDescription) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Example impact data based on material type
  const impactData = {
    Cotton: "High water usage and land consumption.",
    Polyester: "High CO2 emissions; recycling recommended.",
    Spandex: "Energy intensive to produce.",
    Wool: "Emits methane and consumes a lot of water.",
    Silk: "Energy intensive with ethical concerns.",
  };

  // Create a regex to match any of the material keys in the impactData
  const materialsRegex = new RegExp(Object.keys(impactData).join("|"), "gi");

  // Find all material matches in the description
  const matches = materialDescription.match(materialsRegex) || [];

  // Collect the corresponding impact information for all matched materials
  const impacts = matches.map(
    (material) => impactData[material] || "No data available."
  );

  // Remove duplicates and join the results into a single string
  const uniqueImpacts = [...new Set(impacts)].join(" ");

  // Return the combined impact summary or a fallback message if no matches found
  return uniqueImpacts || "No data available.";
}

function styleScrollableContent(scrollableContent) {
  scrollableContent.style.marginTop = "10px";
}

function styleAlternativeItem(altItem) {
  altItem.style.marginBottom = "15px";
  altItem.style.padding = "10px";
  altItem.style.border = "1px solid black";
  altItem.style.borderRadius = "5px";
}

async function searchAlternatives(title, cost) {
  const backendUrl = `http://127.0.0.1:3000/search?q=${encodeURIComponent(
    title
  )}&cost=${encodeURIComponent(cost)}`;
  try {
    const response = await fetch(backendUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log("Search Results:", data);
    return data;
  } catch (error) {
    console.error("Error fetching search results:", error);
  }
}

function createLoadingIndicator() {
  const loadingDiv = document.createElement("div");
  loadingDiv.textContent = "Loading alternatives...";
  loadingDiv.style.fontStyle = "italic";
  loadingDiv.style.marginTop = "10px";
  return loadingDiv;
}

function createBadge() {
  const badge = document.createElement("div");
  badge.id = "smart-fashion-badge";
  badge.style.position = "fixed";
  badge.style.bottom = "20px";
  badge.style.right = "20px";
  badge.style.width = "75px"; // Adjust size as needed
  badge.style.height = "75px"; // Adjust size as needed
  badge.style.cursor = "pointer";
  badge.style.zIndex = "1000";

  // Create an img element for the badge
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("images/smart-fashion-badge.png");
  img.alt = "Smart Fashion";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.borderRadius = "50%"; // Optional: if you want a circular image

  badge.appendChild(img);
  document.body.appendChild(badge);
  return badge;
}

function styleOverlay(overlay) {
  overlay.style.display = "none";
  overlay.style.position = "fixed";
  overlay.style.bottom = "100px"; // Adjust this value to position it above the badge
  overlay.style.right = "20px";
  overlay.style.width = "300px";
  overlay.style.maxHeight = "80vh";
  overlay.style.overflowY = "auto";
  overlay.style.backgroundColor = "rgba(246, 238, 227, 1.0)";
  overlay.style.border = "1px solid #ccc";
  overlay.style.borderRadius = "5px";
  overlay.style.padding = "10px";
  overlay.style.zIndex = "999";
  overlay.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
}

// New function to fetch rank from API
async function fetchMaterialsRank(materials, url) {
  const apiUrl = "http://127.0.0.1:3000/rank";
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ materials, url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Rank Data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching rank:", error);
    return null;
  }
}
