using {events} from '../db/schema';

service EventService {
    entity Events as projection on events.Events;
    entity Venues as projection on events.Venues;
};