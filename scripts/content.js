// Main entry point
(async function init() {
  const materialsSection = getMaterialsSection();
  const targetDiv = getTargetDiv();

  if (materialsSection && targetDiv) {
    const materialsData = extractMaterialsData(materialsSection);
    const enrichedMaterialsData = await enrichWithClimateImpact(materialsData);
    console.log("Enriched Materials Data:", enrichedMaterialsData);

    // Create initial container with loading indicator
    let displayContainer = createMaterialsContainer(
      enrichedMaterialsData,
      null,
      true
    );
    targetDiv.insertAdjacentElement("beforebegin", displayContainer);

    const itemTitle = getItemTitle();
    const itemPrice = getItemPrice();
    const searchResults = await searchAlternatives(itemTitle, itemPrice);
    console.log("Search Results:", searchResults);

    // Remove the loading container and create the final container with results
    displayContainer.remove();
    displayContainer = createMaterialsContainer(
      enrichedMaterialsData,
      searchResults,
      false
    );
    targetDiv.insertAdjacentElement("beforebegin", displayContainer);
  } else {
    console.error("Materials section or target div not found.");
  }
})();

function getItemPrice() {
  // Select the price element using querySelector
  const priceElement = document.querySelector("span.edbe20.ac3d9e.d9ca8b");

  if (priceElement) {
    // Extract and clean the text content (e.g., "$29.99")
    const priceText = priceElement.textContent.trim().replace(/[^0-9.]/g, "");

    // Convert the cleaned string to a float
    const price = parseFloat(priceText);

    console.log("Item Price:", price); // Log the price as a number
    return price;
  } else {
    console.error("Price element not found.");
    return null;
  }
}

function getItemTitle() {
  const titleElement = document.querySelector("h1.fa226d.af6753.d582fb");
  // Check if the element exists and return its text content
  if (titleElement) {
    const titleText = titleElement.textContent.trim();
    console.log("Item Title:", titleText);
    return titleText;
  } else {
    console.error("Title element not found.");
    return null;
  }
}

// Function to get the materials section element
function getMaterialsSection() {
  return document.querySelector("#section-materialsAndSuppliersAccordion");
}

// Function to get the target div where the container should be inserted
function getTargetDiv() {
  return document.querySelector("div.afe616.f971a9.b73169");
}

// Function to extract the materials data from the section
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

// Function to create the container that displays the materials data
function createMaterialsContainer(materialsData, searchResults, isLoading) {
  const container = document.createElement("div");
  styleContainer(container);

  const title = document.createElement("h2");
  title.textContent = "Textile Climate Impact";
  container.appendChild(title);

  const scrollableContent = document.createElement("div");
  styleScrollableContent(scrollableContent);

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
  return container;
}

// Function to apply styles to the container
function styleContainer(container) {
  container.style.padding = "10px";
  container.style.border = "1px solid #ccc";
  container.style.marginBottom = "-30px";
  container.style.backgroundColor = "rgba(246, 238, 227, 1.0)";
  container.style.borderRadius = "5px";
  container.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
  container.style.maxWidth = "400px";
  container.style.maxHeight = "500px";
  container.style.overflowY = "auto";
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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Search Results:", data); // You can update this to display results in your UI
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
