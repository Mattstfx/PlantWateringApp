(function () {
  "use strict";

  const storage = {
    get: function (key, fallback) {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
      }
    }
  };

  const dateOffset = function (days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return dateKey(date);
  };
  const starterPlants = [
    { id: "monstera", name: "Monstera", interval: 7, lastWatered: dateOffset(-8) },
    { id: "fern", name: "Boston fern", interval: 4, lastWatered: dateOffset(-3) },
    { id: "snake", name: "Snake plant", interval: 18, lastWatered: dateOffset(-12) }
  ];
  let plants = storage.get("plants", null);
  if (!Array.isArray(plants)) {
    plants = starterPlants;
    storage.set("plants", plants);
  }

  document.title = STARTUP.name;
  document.getElementById("brand-name").textContent = STARTUP.name;
  document.getElementById("tagline").textContent = STARTUP.tagline;
  document.getElementById("pitch").textContent = STARTUP.pitch;

  const plantList = document.getElementById("plant-list");
  const plantForm = document.getElementById("plant-form");
  const addToggle = document.getElementById("add-toggle");
  const emptyState = document.getElementById("empty-state");
  const plantType = document.getElementById("plant-type");
  const customNameField = document.getElementById("custom-name-field");
  const customName = plantForm.elements.customName;
  const intervalInput = plantForm.elements.interval;
  const wateringGuide = document.getElementById("watering-guide");

  PLANT_GUIDES.forEach(function (guide) {
    const option = document.createElement("option");
    option.value = guide.id;
    option.textContent = guide.name + " (about every " + guide.interval + " days)";
    plantType.appendChild(option);
  });
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Custom plant";
  plantType.appendChild(customOption);

  function localDate(dateString) {
    const parts = dateString.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function dateKey(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function daysUntilWatering(plant) {
    const due = localDate(plant.lastWatered);
    due.setDate(due.getDate() + Number(plant.interval));
    const today = localDate(dateKey(new Date()));
    return Math.round((due - today) / 86400000);
  }

  function formatDue(days) {
    if (days < 0) return Math.abs(days) + " day" + (days === -1 ? "" : "s") + " overdue";
    if (days === 0) return "Water today";
    if (days === 1) return "Water tomorrow";
    return "Water in " + days + " days";
  }

  function makePlantCard(plant) {
    const days = daysUntilWatering(plant);
    const guide = PLANT_GUIDES.find(function (item) { return item.name === plant.name; });
    const card = document.createElement("article");
    card.className = "plant-row" + (days <= 0 ? " needs-water" : "");

    const icon = document.createElement("div");
    icon.className = "plant-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = plant.name.charAt(0).toUpperCase();

    const details = document.createElement("div");
    details.className = "plant-details";
    const name = document.createElement("h3");
    const nameButton = document.createElement("button");
    nameButton.type = "button";
    nameButton.className = "plant-name-trigger";
    nameButton.textContent = plant.name;
    nameButton.setAttribute("aria-expanded", "false");
    nameButton.setAttribute("aria-controls", "plant-preview-" + plant.id);
    nameButton.setAttribute("aria-label", "Show photo and care details for " + plant.name);
    name.appendChild(nameButton);

    const preview = document.createElement("div");
    preview.className = "plant-preview";
    preview.id = "plant-preview-" + plant.id;
    preview.setAttribute("role", "group");
    preview.setAttribute("aria-label", plant.name + " care and photo details");
    if (guide) {
      const image = document.createElement("img");
      image.src = guide.image;
      image.alt = guide.name;
      image.loading = "lazy";

      const previewBody = document.createElement("div");
      previewBody.className = "plant-preview-body";
      const scientificName = document.createElement("p");
      scientificName.className = "scientific-name";
      scientificName.textContent = guide.scientificName;

      const careFacts = document.createElement("dl");
      careFacts.className = "preview-facts";
      const scheduleTerm = document.createElement("dt");
      scheduleTerm.textContent = "Your schedule";
      const scheduleValue = document.createElement("dd");
      scheduleValue.textContent = "Every " + plant.interval + " days";
      const lightTerm = document.createElement("dt");
      lightTerm.textContent = "Light";
      const lightValue = document.createElement("dd");
      lightValue.textContent = guide.light;
      careFacts.append(scheduleTerm, scheduleValue, lightTerm, lightValue);

      const careTip = document.createElement("p");
      careTip.className = "preview-tip";
      careTip.textContent = guide.tip;

      const photoSource = document.createElement("a");
      photoSource.className = "photo-source";
      photoSource.href = guide.imageSource;
      photoSource.target = "_blank";
      photoSource.rel = "noopener noreferrer";
      photoSource.textContent = "Photo: " + guide.imageCredit + " · View source";

      previewBody.append(scientificName, careFacts, careTip, photoSource);
      preview.append(image, previewBody);
    } else {
      const noGuide = document.createElement("p");
      noGuide.className = "no-photo-guide";
      noGuide.textContent = "No photo guide is available for this custom plant yet.";
      preview.appendChild(noGuide);
    }
    nameButton.addEventListener("click", function () {
      const isOpen = details.classList.toggle("is-open");
      card.classList.toggle("previewing", isOpen);
      nameButton.setAttribute("aria-expanded", String(isOpen));
    });
    details.addEventListener("mouseenter", function () {
      card.classList.add("previewing");
    });
    details.addEventListener("mouseleave", function () {
      if (!details.classList.contains("is-open") && !details.contains(document.activeElement)) {
        card.classList.remove("previewing");
      }
    });
    details.addEventListener("focusin", function () {
      card.classList.add("previewing");
    });
    details.addEventListener("focusout", function (event) {
      if (!details.contains(event.relatedTarget) && !details.classList.contains("is-open")) {
        card.classList.remove("previewing");
      }
    });

    const rhythm = document.createElement("p");
    rhythm.className = "plant-rhythm";
    rhythm.textContent = "Every " + plant.interval + " days · Last watered " + localDate(plant.lastWatered).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    details.append(name, preview, rhythm);

    const status = document.createElement("span");
    status.className = "due-status" + (days < 0 ? " overdue" : days === 0 ? " due-today" : " upcoming");
    status.textContent = formatDue(days);

    const actions = document.createElement("div");
    actions.className = "plant-actions";
    if (days <= 0) {
      const waterButton = document.createElement("button");
      waterButton.type = "button";
      waterButton.className = "button water-button";
      waterButton.textContent = "Watered";
      waterButton.setAttribute("aria-label", "Mark " + plant.name + " as watered today");
      waterButton.addEventListener("click", function () {
        plant.lastWatered = dateKey(new Date());
        savePlants();
      });
      actions.appendChild(waterButton);
    }

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove " + plant.name);
    removeButton.addEventListener("click", function () {
      plants = plants.filter(function (savedPlant) { return savedPlant.id !== plant.id; });
      savePlants();
    });
    actions.appendChild(removeButton);
    card.append(icon, details, status, actions);
    return { card: card, days: days };
  }

  function renderPlants() {
    const sorted = plants.map(makePlantCard).sort(function (first, second) {
      return first.days - second.days;
    });
    plantList.replaceChildren.apply(plantList, sorted.map(function (item) { return item.card; }));
    emptyState.hidden = plants.length > 0;
    document.getElementById("plant-total").textContent = plants.length;
    const dueCount = plants.filter(function (plant) { return daysUntilWatering(plant) <= 0; }).length;
    document.getElementById("due-count").textContent = dueCount;
    document.getElementById("summary-title").textContent = dueCount === 0
      ? "You're all caught up."
      : dueCount + " plant" + (dueCount === 1 ? " needs" : "s need") + " a drink.";
    document.getElementById("summary-detail").textContent = dueCount === 0
      ? (plants.length === 0 ? "Add a plant to start your care routine." : "Your plants are on their way to happy.")
      : "Start with the most overdue plant below.";
  }

  function savePlants() {
    storage.set("plants", plants);
    renderPlants();
  }

  addToggle.addEventListener("click", function () {
    const isExpanded = addToggle.getAttribute("aria-expanded") === "true";
    addToggle.setAttribute("aria-expanded", String(!isExpanded));
    plantForm.hidden = isExpanded;
    if (!isExpanded) plantType.focus();
  });

  plantType.addEventListener("change", function () {
    const guide = PLANT_GUIDES.find(function (item) { return item.id === plantType.value; });
    const isCustom = plantType.value === "custom";
    customNameField.hidden = !isCustom;
    customName.required = isCustom;
    if (guide) {
      intervalInput.value = guide.interval;
      wateringGuide.textContent = guide.tip + " Schedule is a starting point; check the soil.";
    } else if (isCustom) {
      wateringGuide.textContent = "Choose an interval based on your plant and check the soil before watering.";
    } else {
      wateringGuide.textContent = "Choose a plant to see its suggested schedule.";
    }
  });

  plantForm.elements.lastWatered.value = dateKey(new Date());
  plantForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(plantForm);
    const guide = PLANT_GUIDES.find(function (item) { return item.id === formData.get("plantType"); });
    plants.push({
      id: String(Date.now()) + String(Math.random()).slice(2),
      name: guide ? guide.name : formData.get("customName").trim(),
      interval: Number(formData.get("interval")),
      lastWatered: formData.get("lastWatered")
    });
    savePlants();
    plantForm.reset();
    intervalInput.value = "7";
    plantForm.elements.lastWatered.value = dateKey(new Date());
    customNameField.hidden = true;
    customName.required = false;
    wateringGuide.textContent = "Choose a plant to see its suggested schedule.";
    plantForm.hidden = true;
    addToggle.setAttribute("aria-expanded", "false");
    addToggle.focus();
  });

  document.getElementById("today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  renderPlants();
})();
