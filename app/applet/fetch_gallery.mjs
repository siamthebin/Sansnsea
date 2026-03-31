import fs from 'fs';

async function fetchGallery() {
  try {
    const response = await fetch('https://postimg.cc/gallery/ZBNTh9L');
    const html = await response.text();
    
    // Extract image URLs
    const regex = /https:\/\/i\.postimg\.cc\/[a-zA-Z0-9]+\/[^"']+/g;
    const matches = html.match(regex);
    
    if (matches) {
      const uniqueUrls = [...new Set(matches)];
      console.log("Found URLs:", uniqueUrls);
    } else {
      console.log("No image URLs found in the HTML.");
    }
  } catch (error) {
    console.error("Error fetching gallery:", error);
  }
}

fetchGallery();
