// ========================================
// LIGHTBOX - Helelism Photography
// ========================================

document.addEventListener('DOMContentLoaded', function() {

  // Get all gallery items
  const galleryItems = document.querySelectorAll('.gallery-item');
  const images = [];

  // Build array of image data
  galleryItems.forEach((item, index) => {
    const img = item.querySelector('.image-wrapper img');
    const title = item.querySelector('.overlay h3')?.innerText || '';
    const desc = item.querySelector('.overlay p')?.innerText || '';
    
    if (img) {
      images.push({
        src: img.src,
        alt: img.alt || title,
        title: title,
        description: desc
      });
    }

    // Add click listener to each item
    item.addEventListener('click', function(e) {
      e.preventDefault();
      openLightbox(index);
    });
  });

  // If no images, exit
  if (images.length === 0) return;

  // Create lightbox DOM elements
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
    <button class="lightbox-nav lightbox-prev" aria-label="Previous image">&#10094;</button>
    <button class="lightbox-nav lightbox-next" aria-label="Next image">&#10095;</button>
    <div class="lightbox-content">
      <img class="lightbox-image" src="" alt="" />
      <div class="lightbox-caption">
        <h3></h3>
        <p></p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Get references
  const closeBtn = overlay.querySelector('.lightbox-close');
  const prevBtn = overlay.querySelector('.lightbox-prev');
  const nextBtn = overlay.querySelector('.lightbox-next');
  const lightboxImg = overlay.querySelector('.lightbox-image');
  const captionTitle = overlay.querySelector('.lightbox-caption h3');
  const captionDesc = overlay.querySelector('.lightbox-caption p');
  let currentIndex = 0;

  // Open lightbox
  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }

  // Close lightbox
  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Update image and caption
  function updateLightbox() {
    const data = images[currentIndex];
    if (!data) return;
    lightboxImg.src = data.src;
    lightboxImg.alt = data.alt;
    captionTitle.textContent = data.title;
    captionDesc.textContent = data.description;
  }

  // Navigate
  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightbox();
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    updateLightbox();
  }

  // --- Event Listeners ---

  // Close button
  closeBtn.addEventListener('click', closeLightbox);

  // Click outside image (on overlay itself) to close
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeLightbox();
    }
  });

  // Previous / Next buttons
  prevBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    prevImage();
  });

  nextBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    nextImage();
  });

  // Keyboard support
  document.addEventListener('keydown', function(e) {
    if (!overlay.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    }
  });

  // If only 1 image, hide arrows
  if (images.length <= 1) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }

});
