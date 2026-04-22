import MeetingService from '../services/MeetingService.js';
import ChatService from '../services/ChatService.js';

export class MeetingController {
  static async scheduleMeeting(req, res, next) {
    try {
      const { conversationId, title, scheduledAt, durationMinutes } = req.body;
      
      const meeting = await MeetingService.createMeeting(
        conversationId, 
        req.user.id, 
        title, 
        scheduledAt, 
        durationMinutes
      );

      // Post a system message to the chat about the meeting
      const dateStr = new Date(scheduledAt).toLocaleString();
      await ChatService.sendMessage(
        conversationId,
        req.user.id,
        `📅 Meeting Scheduled: ${title}\nTime: ${dateStr}`,
        'meeting',
        { meetingId: meeting.id, roomName: meeting.room_name, title, scheduledAt }
      );

      res.status(200).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMeetings(req, res, next) {
    try {
      const { conversationId } = req.params;
      const meetings = await MeetingService.getMeetings(conversationId);
      res.status(200).json({
        success: true,
        data: meetings
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MeetingController;
