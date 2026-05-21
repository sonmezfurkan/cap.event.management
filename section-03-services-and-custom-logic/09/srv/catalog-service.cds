using {events} from '../db/schema';

service CatalogService {
    @readonly
    entity Events   as
        projection on events.Events
        excluding {
            registrations
        };

    @readonly
    entity Venues   as projection on events.Venues;

    @readonly
    entity Speakers as projection on events.Speakers;
}
