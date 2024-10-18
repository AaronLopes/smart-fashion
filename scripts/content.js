// Main entry point
(async function init() {
  const materialsSection = getMaterialsSection();
  const targetDiv = getTargetDiv();

  if (materialsSection && targetDiv) {
    const materialsData = extractMaterialsData(materialsSection);
    // If API enrichment is needed, fetch additional climate data asynchronously
    const enrichedMaterialsData = await enrichWithClimateImpact(materialsData);
    console.log("Enriched Materials Data:", enrichedMaterialsData); // Log the data to the console
    // create the container which contains the materials data
    const displayContainer = createMaterialsContainer(enrichedMaterialsData);
    // Insert the container above the target div
    targetDiv.insertAdjacentElement("beforebegin", displayContainer);

    console.log("Materials Data:", materialsData); // Log the data to the console
  } else {
    console.error("Materials section or target div not found.");
  }
})();

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
function createMaterialsContainer(materialsData) {
  const container = document.createElement("div");
  styleContainer(container);

  // Add a title
  const title = document.createElement("h2");
  title.textContent = "Textile Climate Impact";
  container.appendChild(title);

  // Add each material as a paragraph
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
      container.appendChild(materialItem);
    }
  });

  return container;
}

// Function to apply styles to the container
function styleContainer(container) {
  container.style.padding = "10px";
  container.style.border = "1px solid #ccc";
  container.style.marginBottom = "-30px";
  container.style.backgroundColor = "rgba(119, 183, 239, 0.34)"; // 80% opacity
  container.style.borderRadius = "5px";
  container.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
}
