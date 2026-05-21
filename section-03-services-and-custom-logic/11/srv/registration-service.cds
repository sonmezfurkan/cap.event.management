using {events} from '../db/schema';

service RegistrationService {
    @readonly entity Events as projection on events.Events {
        ID,
        title,
        description,
        startDate,
        endDate,
        maxCapacity,
        status,
        venue
    };
    @readonly entity Venues as projection on events.Venues;
    entity Registrations as projection on events.Registrations;
}