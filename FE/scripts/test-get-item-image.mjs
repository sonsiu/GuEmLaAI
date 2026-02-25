import { wardrobeService } from '../src/services/wardrobe.service'

const run = async () => {
  try {
    const image = await wardrobeService.getItemImage(73)
    //console.log('image', image)
  } catch (error) {
    //console.error('error', error)
  }
}

run()
