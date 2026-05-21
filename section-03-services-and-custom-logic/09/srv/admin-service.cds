using {events} from '../db/schema';

service AdminService {
    entity Events as projection on events.Events;
    entity Venues as projection on events.Venues;
    entity Speakers as projection on events.Speakers;
}