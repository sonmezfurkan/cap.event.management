using {events} from '../db/schema';

@requires: ['Admin', 'Organizer']
service AdminService {
    @odata.draft.enabled

    @restrict: [
        { grant: '*', to: 'Admin' },
        { grant: '*', to: 'Organizer' }
    ]
    entity Events as projection on events.Events {
        *,
        virtual statusCriticality: Integer
    }
    actions {
        action publish();
        action cancelEvent();
    };

    @restrict: [
        { grant: '*', to: 'Admin' },
        { grant: 'READ', to: 'Organizer' }
    ]
    entity Venues as projection on events.Venues;

    @restrict: [
        { grant: '*', to: 'Admin' },
        { grant: 'READ', to: 'Organizer' }
    ]
    entity Speakers as projection on events.Speakers;
    @readonly entity EventStatuses as projection on events.EventStatuses;

    event EventPublished : {
        eventId : UUID;
        title   : String;
    };

    event EventCancelled : {
        eventId : UUID;
        title   : String;
    };
}