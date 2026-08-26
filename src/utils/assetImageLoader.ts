import img1 from '../assets/DG-West-Bedroom.webp'
import img2 from '../assets/DG-West-Reception-scaled.webp'
import img3 from '../assets/DG-West-Rooftop-scaled.webp'
import img4 from '../assets/DG-West-Sitting-room.webp'
import img5 from '../assets/DG-West-Sitting.webp'
import img6 from '../assets/DG-West-Swiming-scaled.webp'
import img7 from '../assets/DG-West-restaurant-scaled.webp'
import img8 from '../assets/Alba-Gardens-1024x768.png'
import img9 from '../assets/IMG-20250408-WA0005.jpg'
import img10 from '../assets/IMG-20250408-WA0006.jpg'
import img11 from '../assets/IMG-20250408-WA0007.jpg'
import img12 from '../assets/IMG-20250408-WA0008.jpg'
import img13 from '../assets/IMG-20250408-WA0009.jpg'
import img14 from '../assets/IMG-20250408-WA0010.jpg'
import img15 from '../assets/IMG-20250408-WA0011.jpg'
import img16 from '../assets/IMG-20250408-WA0013.jpg'
import img17 from '../assets/IMG-20250408-WA0014.jpg'
import img18 from '../assets/IMG-20250408-WA0015.jpg'
import img19 from '../assets/img-1280x720.jpg'
import img20 from '../assets/img-scaled.jpg'
import img21 from '../assets/rooftop-DG-West-scaled.webp'

export const ASSET_IMAGES = [
  img1, img2, img3, img4, img5, img6, img7, img8, img9, img10,
  img11, img12, img13, img14, img15, img16, img17, img18, img19, img20, img21,
]

export function mapPropertyImages(propertyIndex: number): string[] {
  const imagesPerProperty = 3
  const startIdx = (propertyIndex % Math.ceil(ASSET_IMAGES.length / imagesPerProperty)) * imagesPerProperty
  return Array.from({ length: imagesPerProperty }).map((_, i) => 
    ASSET_IMAGES[(startIdx + i) % ASSET_IMAGES.length]
  )
}

export function getPropertyThumbnail(propertyIndex: number): string {
  return mapPropertyImages(propertyIndex)[0]
}
