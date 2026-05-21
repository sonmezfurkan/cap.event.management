using {events} from '../db/schema';

service AdminService {
    entity Events as projection on events.Events actions {
        action publish();
        action cancelEvent();
    };
    entity Venues as projection on events.Venues;
    entity Speakers as projection on events.Speakers;

    event EventPublished : {
        eventId : UUID;
        title   : String;
    };

    event EventCancelled : {
        eventId : UUID;
        title   : String;
    };
}