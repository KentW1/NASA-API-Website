// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.getElementById('getImagesButton');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

let apodModal;
let modalImage;
let modalTitle;
let modalDate;
let modalExplanation;
let modalCloseButton;

function formatDate(dateObject) {
  return dateObject.toISOString().split('T')[0];
}

function addDays(dateString, daysToAdd) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + daysToAdd);
  return formatDate(date);
}

function getNineDayRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return null;
  }

  let normalizedStart = startDate;
  let normalizedEnd = endDate;

  if (new Date(normalizedEnd) < new Date(normalizedStart)) {
    normalizedStart = endDate;
    normalizedEnd = startDate;
  }

  const maxEnd = addDays(normalizedStart, 8);
  if (new Date(normalizedEnd) > new Date(maxEnd)) {
    normalizedEnd = maxEnd;
  }

  return {
    start: normalizedStart,
    end: normalizedEnd,
  };
}

function showGalleryMessage(message) {
  gallery.innerHTML = '';

  const messageBox = document.createElement('div');
  messageBox.className = 'gallery-message';
  messageBox.textContent = message;

  gallery.appendChild(messageBox);
}

function closeImageModal() {
  if (!apodModal) {
    return;
  }

  apodModal.classList.remove('is-open');
  apodModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function openImageModal(apodData) {
  if (!apodModal) {
    return;
  }

  const fullSizeImage = apodData.hdurl || apodData.url;

  modalImage.src = fullSizeImage;
  modalImage.alt = apodData.title;
  modalTitle.textContent = apodData.title;
  modalDate.textContent = `Date: ${apodData.date}`;
  modalExplanation.textContent = apodData.explanation;

  apodModal.classList.add('is-open');
  apodModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function setupImageModal() {
  apodModal = document.createElement('div');
  apodModal.className = 'image-modal';
  apodModal.setAttribute('aria-hidden', 'true');

  const modalContent = document.createElement('div');
  modalContent.className = 'image-modal-content';

  modalCloseButton = document.createElement('button');
  modalCloseButton.className = 'image-modal-close';
  modalCloseButton.type = 'button';
  modalCloseButton.setAttribute('aria-label', 'Close image details');
  modalCloseButton.textContent = 'X';

  modalImage = document.createElement('img');
  modalImage.className = 'image-modal-picture';

  modalTitle = document.createElement('h2');
  modalTitle.className = 'image-modal-title';

  modalDate = document.createElement('p');
  modalDate.className = 'image-modal-date';

  modalExplanation = document.createElement('p');
  modalExplanation.className = 'image-modal-explanation';

  modalContent.appendChild(modalCloseButton);
  modalContent.appendChild(modalImage);
  modalContent.appendChild(modalTitle);
  modalContent.appendChild(modalDate);
  modalContent.appendChild(modalExplanation);
  apodModal.appendChild(modalContent);
  document.body.appendChild(apodModal);

  modalCloseButton.addEventListener('click', closeImageModal);

  apodModal.addEventListener('click', (event) => {
    if (event.target === apodModal) {
      closeImageModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && apodModal.classList.contains('is-open')) {
      closeImageModal();
    }
  });
}

function createImageCard(apodData) {
  const imageSource = apodData.url;

  const card = document.createElement('article');
  card.className = 'gallery-item';

  const image = document.createElement('img');
  image.className = 'gallery-thumbnail';
  image.src = imageSource;
  image.alt = apodData.title;
  image.loading = 'lazy';

  const thumbnailButton = document.createElement('button');
  thumbnailButton.type = 'button';
  thumbnailButton.className = 'gallery-image-button';
  thumbnailButton.setAttribute('aria-label', `Open details for ${apodData.title}`);
  thumbnailButton.appendChild(image);

  thumbnailButton.addEventListener('click', () => {
    openImageModal(apodData);
  });

  const cardTitle = document.createElement('h3');
  cardTitle.className = 'gallery-title';
  cardTitle.textContent = apodData.title;

  const cardDate = document.createElement('p');
  cardDate.className = 'gallery-date';
  cardDate.textContent = `Date: ${apodData.date}`;

  card.appendChild(thumbnailButton);
  card.appendChild(cardTitle);
  card.appendChild(cardDate);

  return card;
}

function renderGalleryCards(images) {
  gallery.innerHTML = '';

  images.forEach((imageData) => {
    gallery.appendChild(createImageCard(imageData));
  });
}

function keepUniqueImagesByDate(items) {
  const seenDates = new Set();

  return items.filter((item) => {
    if (item.media_type !== 'image') {
      return false;
    }

    if (seenDates.has(item.date)) {
      return false;
    }

    seenDates.add(item.date);
    return true;
  });
}

async function fetchRandomImageSet(count) {
  const apiKey = '9CvlcVZSlxBwC07r9weC2eaz0i1pPuLJPEmnkCnw';
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&count=${count}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching random APOD data:', error);
    return [];
  }
}

async function fetchAtLeastNineRandomImages() {
  const minImages = 9;
  const maxAttempts = 3;
  let uniqueImages = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const randomBatch = await fetchRandomImageSet(20);
    uniqueImages = keepUniqueImagesByDate([...uniqueImages, ...randomBatch]);

    if (uniqueImages.length >= minImages) {
      break;
    }
  }

  return uniqueImages.slice(0, minImages);
}

async function fetchAPODRange(startDate, endDate) {
  const apiKey = '9CvlcVZSlxBwC07r9weC2eaz0i1pPuLJPEmnkCnw';
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data; // Returns an array of objects
  } catch (error) {
    console.error('Error fetching APOD data:', error);
    showGalleryMessage('Sorry, we could not load the space images right now.');
    return [];
  }
}

async function loadRandomGallery() {
  showGalleryMessage('Loading random space images...');

  const images = await fetchAtLeastNineRandomImages();
  if (!images.length) {
    showGalleryMessage('Sorry, we could not load random space images right now.');
    return;
  }

  renderGalleryCards(images);
}

async function loadDateFilteredGallery() {
  const range = getNineDayRange(startInput.value, endInput.value);
  if (!range) {
    showGalleryMessage('Please choose valid start and end dates.');
    return;
  }

  // Keep the input values in sync with the required 9-day filter window.
  startInput.value = range.start;
  endInput.value = range.end;

  showGalleryMessage('Loading filtered space images...');

  const images = await fetchAPODRange(range.start, range.end);
  const imageItems = keepUniqueImagesByDate(images);

  if (!imageItems.length) {
    showGalleryMessage('No images were available for that date range.');
    return;
  }

  renderGalleryCards(imageItems);
}

getImagesButton.addEventListener('click', loadDateFilteredGallery);

setupImageModal();
loadRandomGallery();
