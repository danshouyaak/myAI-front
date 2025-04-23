import { ref } from 'vue';

export const aiModels = ref([
  {
    id: 1,
    name: 'AI医生',
    avatar: 'src/assets/doctor.png',
    description: '当医生已经30年了'
  },
  {
    id: 2,
    name: 'AI数学家',
    avatar: 'src/assets/Mathematician.png',
    description: '具有多年的数学经验'
  }
]);
