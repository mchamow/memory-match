type Face = readonly [emoji: string, name: string]

export type Theme = 'animals' | 'food' | 'things'

export const THEMES: Record<Theme, { label: string; cards: readonly Face[] }> = {
  animals: {
    label: 'Animals',
    cards: [
      ['🐶', 'Dog'], ['🐱', 'Cat'], ['🐭', 'Mouse'], ['🐹', 'Hamster'], ['🐰', 'Rabbit'],
      ['🦊', 'Fox'], ['🐻', 'Bear'], ['🐼', 'Panda'], ['🐨', 'Koala'], ['🐯', 'Tiger'],
      ['🦁', 'Lion'], ['🐮', 'Cow'], ['🐷', 'Pig'], ['🐸', 'Frog'], ['🐵', 'Monkey'],
      ['🐔', 'Chicken'], ['🐧', 'Penguin'], ['🦉', 'Owl'], ['🐢', 'Turtle'], ['🐙', 'Octopus'],
    ],
  },
  food: {
    label: 'Food',
    cards: [
      ['🍎', 'Apple'], ['🍌', 'Banana'], ['🍇', 'Grapes'], ['🍓', 'Strawberry'], ['🍒', 'Cherries'],
      ['🍑', 'Peach'], ['🍍', 'Pineapple'], ['🥝', 'Kiwi'], ['🥑', 'Avocado'], ['🥕', 'Carrot'],
      ['🌽', 'Corn'], ['🍕', 'Pizza'], ['🍔', 'Burger'], ['🌮', 'Taco'], ['🍩', 'Doughnut'],
      ['🍪', 'Cookie'], ['🧁', 'Cupcake'], ['🍦', 'Ice cream'], ['🥨', 'Pretzel'], ['🧀', 'Cheese'],
    ],
  },
  things: {
    label: 'Things',
    cards: [
      ['⚽', 'Soccer ball'], ['🏀', 'Basketball'], ['🎾', 'Tennis ball'], ['🎱', 'Pool ball'], ['🎯', 'Target'],
      ['🛹', 'Skateboard'], ['🚲', 'Bicycle'], ['🚀', 'Rocket'], ['✈️', 'Airplane'], ['🚗', 'Car'],
      ['⛵', 'Sailboat'], ['🎸', 'Guitar'], ['🎹', 'Piano'], ['🎲', 'Die'], ['🧩', 'Puzzle piece'],
      ['🔑', 'Key'], ['💡', 'Light bulb'], ['📷', 'Camera'], ['⏰', 'Alarm clock'], ['🎈', 'Balloon'],
    ],
  },
}
export const THEME_NAMES = Object.keys(THEMES) as Theme[]
