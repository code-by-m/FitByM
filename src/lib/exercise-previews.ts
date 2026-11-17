// Original FitByM schematics. Coordinates describe two key positions, not stock media.
export type Point = [number, number];
export type Pose = { head: Point; chains: Point[][] };
const pose = (head: Point, ...chains: Point[][]): Pose => ({ head, chains });
const standing = pose(
  [85, 20],
  [
    [85, 35],
    [85, 88],
  ],
  [
    [85, 88],
    [74, 115],
    [74, 140],
    [86, 140],
  ],
  [
    [85, 88],
    [98, 115],
    [98, 140],
    [110, 140],
  ],
  [
    [85, 43],
    [66, 67],
    [75, 88],
  ],
  [
    [85, 43],
    [104, 67],
    [95, 88],
  ],
);
const quadruped = pose(
  [36, 68],
  [
    [49, 80],
    [109, 80],
  ],
  [
    [49, 80],
    [49, 110],
    [49, 140],
  ],
  [
    [55, 80],
    [62, 110],
    [62, 140],
  ],
  [
    [109, 80],
    [113, 140],
    [145, 140],
  ],
  [
    [104, 80],
    [100, 135],
    [130, 135],
  ],
);
const prone = (raised: boolean) =>
  pose(
    [85, 20],
    [
      [85, 35],
      [85, 95],
    ],
    [
      [85, 95],
      [71, 119],
      [69, 142],
    ],
    [
      [85, 95],
      [99, 119],
      [101, 142],
    ],
    [
      [85, 43],
      [60, raised ? 58 : 65],
      [52, raised ? 30 : 42],
    ],
    [
      [85, 43],
      [110, raised ? 58 : 65],
      [118, raised ? 30 : 42],
    ],
  );
export type ExercisePreviewDefinition = {
  name: string;
  first: Pose;
  second: Pose;
  labels?: [string, string];
  view?: 'top';
  support?: 'wall' | 'bench';
};
export const exercisePreviews: Record<string, ExercisePreviewDefinition> = {
  'exercise-0': {
    name: 'Bodyweight Squat',
    first: standing,
    second: pose(
      [95, 52],
      [
        [88, 66],
        [59, 99],
      ],
      [
        [59, 99],
        [102, 104],
        [94, 140],
        [108, 140],
      ],
      [
        [59, 99],
        [80, 112],
        [74, 140],
        [87, 140],
      ],
      [
        [88, 70],
        [111, 78],
        [134, 66],
      ],
      [
        [84, 74],
        [105, 84],
        [128, 74],
      ],
    ),
  },
  'exercise-1': {
    name: 'Wall Push-Up',
    support: 'wall',
    first: pose(
      [95, 24],
      [
        [91, 39],
        [74, 88],
        [56, 140],
      ],
      [
        [91, 45],
        [119, 45],
        [145, 45],
      ],
      [
        [91, 49],
        [119, 53],
        [145, 53],
      ],
      [
        [56, 140],
        [70, 140],
      ],
    ),
    second: pose(
      [127, 26],
      [
        [118, 42],
        [89, 89],
        [56, 140],
      ],
      [
        [118, 47],
        [104, 73],
        [145, 45],
      ],
      [
        [118, 51],
        [109, 81],
        [145, 53],
      ],
      [
        [56, 140],
        [70, 140],
      ],
    ),
  },
  'exercise-2': {
    name: 'Glute Bridge',
    labels: ['Yerde', 'Kalçayı kaldır'],
    first: pose(
      [24, 126],
      [
        [38, 132],
        [85, 132],
      ],
      [
        [85, 132],
        [123, 99],
        [147, 140],
        [158, 140],
      ],
      [
        [38, 134],
        [60, 140],
        [87, 140],
      ],
    ),
    second: pose(
      [24, 126],
      [
        [38, 132],
        [84, 101],
      ],
      [
        [84, 101],
        [123, 99],
        [147, 140],
        [158, 140],
      ],
      [
        [38, 134],
        [60, 140],
        [87, 140],
      ],
    ),
  },
  'exercise-3': {
    name: 'Bird Dog',
    labels: ['Dört ayak', 'Karşı kol ve bacak'],
    first: quadruped,
    second: pose(
      [36, 68],
      [
        [49, 80],
        [109, 80],
      ],
      [
        [49, 80],
        [28, 80],
        [7, 80],
      ],
      [
        [55, 80],
        [62, 110],
        [62, 140],
      ],
      [
        [109, 80],
        [138, 80],
        [166, 80],
      ],
      [
        [104, 80],
        [100, 140],
        [130, 140],
      ],
    ),
  },
  'exercise-4': {
    name: 'Reverse Snow Angel',
    view: 'top',
    labels: ['Kollar yanda', 'Baş üzerine uzat'],
    first: pose(
      [85, 20],
      [
        [85, 35],
        [85, 95],
      ],
      [
        [85, 95],
        [71, 119],
        [69, 142],
      ],
      [
        [85, 95],
        [99, 119],
        [101, 142],
      ],
      [
        [85, 43],
        [60, 67],
        [65, 94],
      ],
      [
        [85, 43],
        [110, 67],
        [105, 94],
      ],
    ),
    second: pose(
      [85, 20],
      [
        [85, 35],
        [85, 95],
      ],
      [
        [85, 95],
        [71, 119],
        [69, 142],
      ],
      [
        [85, 95],
        [99, 119],
        [101, 142],
      ],
      [
        [85, 43],
        [63, 20],
        [47, 2],
      ],
      [
        [85, 43],
        [107, 20],
        [123, 2],
      ],
    ),
  },
  'exercise-5': {
    name: 'Plank',
    labels: ['Kurulum', 'Pozisyonu koru'],
    first: pose(
      [43, 78],
      [
        [55, 95],
        [103, 108],
      ],
      [
        [55, 95],
        [45, 140],
        [16, 140],
      ],
      [
        [103, 108],
        [113, 140],
        [153, 140],
      ],
    ),
    second: pose(
      [43, 72],
      [
        [55, 90],
        [104, 110],
        [160, 132],
        [160, 140],
      ],
      [
        [55, 90],
        [45, 140],
        [16, 140],
      ],
    ),
  },
  'exercise-6': {
    name: 'Reverse Lunge',
    labels: ['Ayakta', 'Geri adım'],
    first: standing,
    second: pose(
      [90, 29],
      [
        [90, 44],
        [90, 94],
      ],
      [
        [90, 94],
        [48, 96],
        [48, 140],
        [62, 140],
      ],
      [
        [90, 94],
        [113, 137],
        [151, 137],
        [151, 140],
      ],
      [
        [90, 50],
        [72, 73],
        [84, 93],
      ],
      [
        [90, 50],
        [107, 73],
        [97, 93],
      ],
    ),
  },
  'exercise-7': {
    name: 'Incline Push-Up',
    support: 'bench',
    labels: ['Yüksek yüzeyde', 'Kontrollü yaklaş'],
    first: pose(
      [119, 32],
      [
        [110, 48],
        [72, 91],
        [32, 140],
      ],
      [
        [110, 53],
        [125, 78],
        [140, 100],
      ],
      [
        [32, 140],
        [46, 140],
      ],
    ),
    second: pose(
      [132, 65],
      [
        [118, 80],
        [76, 110],
        [32, 140],
      ],
      [
        [118, 83],
        [105, 108],
        [140, 100],
      ],
      [
        [32, 140],
        [46, 140],
      ],
    ),
  },
  'exercise-8': {
    name: 'Bodyweight Good Morning',
    labels: ['Ayakta', 'Kalçadan eğil'],
    first: standing,
    second: pose(
      [123, 39],
      [
        [111, 53],
        [74, 93],
      ],
      [
        [74, 93],
        [87, 118],
        [76, 140],
        [90, 140],
      ],
      [
        [74, 93],
        [102, 118],
        [99, 140],
        [113, 140],
      ],
      [
        [108, 57],
        [106, 82],
        [80, 94],
      ],
      [
        [105, 61],
        [95, 88],
        [79, 96],
      ],
    ),
  },
  'exercise-9': {
    name: 'Prone W Raise',
    view: 'top',
    labels: ['W pozisyonu', 'Kolları hafif kaldır'],
    first: prone(false),
    second: prone(true),
  },
  'exercise-10': {
    name: 'Dead Bug',
    labels: ['Sırtüstü kurulum', 'Karşı kol ve bacak'],
    first: pose(
      [24, 125],
      [
        [38, 132],
        [91, 132],
      ],
      [
        [91, 132],
        [91, 92],
        [125, 92],
      ],
      [
        [91, 132],
        [106, 96],
        [140, 96],
      ],
      [
        [40, 132],
        [42, 100],
        [44, 75],
      ],
      [
        [40, 132],
        [56, 100],
        [60, 75],
      ],
    ),
    second: pose(
      [24, 125],
      [
        [38, 132],
        [91, 132],
      ],
      [
        [91, 132],
        [97, 92],
        [131, 92],
      ],
      [
        [91, 132],
        [127, 134],
        [164, 140],
      ],
      [
        [40, 132],
        [20, 134],
        [5, 134],
      ],
      [
        [40, 132],
        [56, 100],
        [60, 75],
      ],
    ),
  },
  'exercise-11': {
    name: 'Standing Calf Raise',
    labels: ['Topuklar yerde', 'Parmak ucuna yüksel'],
    first: standing,
    second: pose(
      [85, 10],
      [
        [85, 25],
        [85, 78],
      ],
      [
        [85, 78],
        [74, 105],
        [74, 130],
        [86, 140],
      ],
      [
        [85, 78],
        [98, 105],
        [98, 130],
        [110, 140],
      ],
      [
        [85, 33],
        [66, 57],
        [75, 78],
      ],
      [
        [85, 33],
        [104, 57],
        [95, 78],
      ],
    ),
  },
};
export function getExercisePreview(id: string, name: string) {
  const preview = Object.hasOwn(exercisePreviews, id) ? exercisePreviews[id] : undefined;
  return preview?.name === name ? preview : undefined;
}
