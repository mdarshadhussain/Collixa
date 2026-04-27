import ChatService from './src/services/ChatService.js';
import NotificationService from './src/services/NotificationService.js';

async function main() {
  try {
    // We already created conversation 93 in previous step.
    const res = await ChatService.acceptDirectRequest(93, 'a1d3d553-b81a-494b-b540-e29b5b49df07');
    console.log('Success:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
