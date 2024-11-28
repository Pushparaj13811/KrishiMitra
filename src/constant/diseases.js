const diseaseRecommendations = {
  scab: {
    preventive_measures: [
      "Plant resistant apple varieties.",
      "Apply fungicides early in the growing season, especially during wet periods.",
      "Ensure proper spacing between trees to improve air circulation and reduce humidity.",
      "Prune infected branches and leaves to prevent disease spread.",
    ],
    curative_measures: [
      "Remove infected leaves and fruits immediately to reduce spore spread.",
      "Use copper-based fungicides or lime sulfur sprays for curative treatment.",
      "Apply fungicides containing Myclobutanil or Difenoconazole during active infection.",
      "Use potassium bicarbonate to control fungal growth.",
    ],
    organic_treatment: [
      "Neem oil to prevent fungal growth.",
      "Potassium bicarbonate for scab management.",
      "Horticultural oils to suffocate fungal spores.",
      "Bordeaux mixture for effective fungicide action.",
    ],
    pesticides: ["Chlorothalonil", "Captan", "Myclobutanil", "Difenoconazole"],
  },
  "black rot": {
    preventive_measures: [
      "Remove and destroy infected fruits and twigs.",
      "Apply fungicides before bloom and during early fruit development.",
      "Ensure proper drainage and avoid overhead irrigation to reduce humidity.",
      "Avoid planting apple varieties susceptible to black rot.",
    ],
    curative_measures: [
      "Remove infected plant parts to reduce disease spread.",
      "Apply fungicides such as Propiconazole or Pyraclostrobin during infection.",
      "Use copper-based fungicides during the growing season.",
      "Ensure proper air circulation around trees to prevent moisture buildup.",
    ],
    organic_treatment: [
      "Neem oil for curbing fungal growth.",
      "Bordeaux mixture as a preventative treatment.",
      "Apply garlic oil or chamomile tea as a mild organic fungicide.",
      "Diatomaceous earth around the base to control fungal spread.",
    ],
    pesticides: [
      "Propiconazole",
      "Pyraclostrobin",
      "Chlorothalonil",
      "Mancozeb",
    ],
  },
  cedar: {
    preventive_measures: [
      "Plant rust-resistant apple varieties.",
      "Remove and dispose of infected leaves and fruits.",
      "Apply fungicides during the bud break stage.",
      "Avoid planting near cedar trees, as they are a host for the disease.",
    ],
    curative_measures: [
      "Remove infected plant parts to limit spore release.",
      "Apply fungicides containing Myclobutanil or Mancozeb.",
      "Treat with copper-based fungicides during the growing season.",
      "Use systemic fungicides such as Tebuconazole for better absorption.",
    ],
    organic_treatment: [
      "Neem oil to prevent rust infection.",
      "Baking soda solution as a preventive measure.",
      "Spray with chamomile or garlic tea to combat fungal infections.",
      "Use a mixture of water and seaweed extract to boost plant immunity.",
    ],
    pesticides: ["Myclobutanil", "Mancozeb", "Tebuconazole", "Chlorothalonil"],
  },
  "powdery mildew": {
    preventive_measures: [
      "Ensure adequate spacing between plants for better air circulation.",
      "Remove infected leaves and fruit to reduce the spread of mildew.",
      "Apply fungicides before symptoms appear, especially during wet conditions.",
      "Prune trees to promote airflow and reduce humidity around foliage.",
    ],
    curative_measures: [
      "Use fungicides like Sulfur, Myclobutanil, or Propiconazole.",
      "Remove infected plant parts immediately.",
      "Use systemic fungicides for better absorption into the plant.",
      "For severe cases, consider using a combination of fungicides and neem oil.",
    ],
    organic_treatment: [
      "Neem oil to treat powdery mildew.",
      "Baking soda solution for controlling mildew.",
      "Spray with a diluted milk solution (1 part milk to 2 parts water).",
      "Use compost tea to boost plant health and natural defenses.",
    ],
    pesticides: ["Myclobutanil", "Propiconazole", "Sulfur", "Chlorothalonil"],
  },
  "common rust": {
    preventive_measures: [
      "Plant rust-resistant corn hybrids.",
      "Rotate crops to reduce the buildup of the rust pathogen.",
      "Avoid planting corn in areas with high humidity and frequent rains.",
      "Use fungicides early in the growing season to prevent initial infection.",
    ],
    curative_measures: [
      "Apply fungicides such as Azoxystrobin, Propiconazole, or Tebuconazole.",
      "Remove and destroy infected plant parts to prevent disease spread.",
      "Ensure proper spacing and air circulation to reduce humidity around plants.",
      "Use a combination of contact and systemic fungicides for better disease control.",
    ],
    organic_treatment: [
      "Neem oil to control rust infections.",
      "Baking soda spray as a preventive measure for fungal diseases.",
      "Use seaweed extract to enhance plant immunity.",
      "Garlic oil as a natural fungicide.",
    ],
    pesticides: [
      "Azoxystrobin",
      "Propiconazole",
      "Tebuconazole",
      "Chlorothalonil",
    ],
  },
  "northern leaf blight": {
    preventive_measures: [
      "Plant resistant corn hybrids.",
      "Practice crop rotation with non-grass crops to reduce pathogen buildup.",
      "Avoid excessive irrigation and water the base of plants to keep leaves dry.",
      "Use fungicides at the first sign of disease, especially during wet weather.",
    ],
    curative_measures: [
      "Apply fungicides such as Chlorothalonil, Propiconazole, or Azoxystrobin.",
      "Remove and dispose of infected leaves and debris.",
      "Ensure good airflow around plants to reduce humidity.",
      "Use systemic fungicides that penetrate deeper into the plant tissue.",
    ],
    organic_treatment: [
      "Neem oil to prevent fungal infections.",
      "Baking soda solution as a mild fungicide.",
      "Spray with compost tea for soil health and plant resistance.",
      "Use diatomaceous earth to prevent fungal spores from spreading.",
    ],
    pesticides: ["Chlorothalonil", "Propiconazole", "Azoxystrobin", "Mancozeb"],
  },
  "gray leaf spot": {
    preventive_measures: [
      "Use resistant corn varieties.",
      "Avoid planting corn in areas with high humidity.",
      "Apply fungicides early to prevent infection.",
      "Rotate crops to reduce the buildup of the pathogen.",
    ],
    curative_measures: [
      "Use fungicides such as Chlorothalonil, Propiconazole, or Azoxystrobin.",
      "Remove and destroy infected leaves and plant material.",
      "Ensure proper spacing between plants for better air circulation.",
      "Apply foliar fungicides regularly during the growing season.",
    ],
    organic_treatment: [
      "Neem oil for controlling fungal infections.",
      "Baking soda spray for early-stage prevention.",
      "Use compost tea to encourage healthy plant growth.",
      "Garlic spray as a natural antifungal.",
    ],
    pesticides: ["Chlorothalonil", "Propiconazole", "Azoxystrobin", "Mancozeb"],
  },
  "black rot": {
    preventive_measures: [
      "Remove infected leaves and fruit clusters.",
      "Apply fungicides early in the growing season.",
      "Ensure good air circulation to reduce moisture buildup.",
      "Practice crop rotation and avoid planting in areas where black rot is prevalent.",
    ],
    curative_measures: [
      "Use fungicides like Myclobutanil, Pyraclostrobin, or Azoxystrobin.",
      "Remove and destroy all infected plant material.",
      "Use copper-based fungicides for early infection control.",
      "Apply systemic fungicides for better disease control.",
    ],
    organic_treatment: [
      "Neem oil for curbing fungal spread.",
      "Baking soda solution for mildew and fungal control.",
      "Compost tea to enhance soil health and plant resistance.",
      "Spray with a garlic-based solution for fungal prevention.",
    ],
    pesticides: [
      "Myclobutanil",
      "Pyraclostrobin",
      "Azoxystrobin",
      "Chlorothalonil",
    ],
  },
  escas: {
    preventive_measures: [
      "Prune infected plants and remove infected wood.",
      "Use fungicides during the early season.",
      "Avoid excessive irrigation, which can promote fungal growth.",
      "Ensure good drainage to avoid waterlogging around grapevines.",
    ],
    curative_measures: [
      "Remove and dispose of infected plant material.",
      "Apply fungicides such as copper-based products or systemic fungicides.",
      "Monitor vines for symptoms and treat immediately.",
      "Use balanced fertilizers to reduce stress on plants.",
    ],
    organic_treatment: [
      "Neem oil for controlling fungal infections.",
      "Baking soda solution to control fungal growth.",
      "Garlic spray for natural antifungal action.",
      "Compost tea to promote plant health.",
    ],
    pesticides: [
      "Copper-based fungicides",
      "Myclobutanil",
      "Pyraclostrobin",
      "Azoxystrobin",
    ],
  },
  "early blight": {
    preventive_measures: [
      "Plant early blight-resistant potato varieties.",
      "Ensure proper crop rotation to reduce the buildup of fungal pathogens.",
      "Avoid overhead irrigation to reduce moisture on leaves.",
      "Apply fungicides at the first sign of disease or as a preventive measure early in the growing season.",
    ],
    curative_measures: [
      "Remove and destroy infected leaves and plant debris.",
      "Use fungicides such as Chlorothalonil, Mancozeb, or Copper-based fungicides.",
      "Apply systemic fungicides like Propiconazole or Tebuconazole during active infection.",
      "Use fungicide applications in rotation to avoid resistance development.",
    ],
    organic_treatment: [
      "Neem oil to control early blight and prevent further fungal growth.",
      "Baking soda solution as a mild fungicide to prevent fungal infections.",
      "Compost tea for improving soil health and boosting plant resistance.",
      "Spray with a mixture of garlic and water to control fungal infections.",
    ],
    pesticides: ["Chlorothalonil", "Mancozeb", "Propiconazole", "Tebuconazole"],
  },
};


export default diseaseRecommendations;
