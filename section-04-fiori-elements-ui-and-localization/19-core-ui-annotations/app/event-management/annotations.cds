using AdminService as service from '../../srv/admin-service';

annotate service.Events with @(
    UI.SelectionFields: [
        status,
        startDate,
        venue_ID
    ],
    UI.LineItem: [
        { Value: title },
        { Value: status },
        { Value: startDate },
        { Value: endDate },
        { Value: venue_ID },
        { Value: attendeeCount },
        { Value: seatsRemaining },
    ]
);

annotate service.Events with {
    title @Common.Label : 'Title';
    status @Common.Label : 'Status';
    description @Common.Label : 'Description';
    startDate @Common.Label : 'Start Date';
    endDate @Common.Label : 'End Date';
    maxCapacity @Common.Label : 'Maximum Capacity';
    attendeeCount @Common.Label : 'Attendee Count';
    seatsRemaining @Common.Label : 'Seats Remaining';
    venue @(
        Common.Label: 'Venue',
        Common.Text: venue.name,
        Common.TextArrangement: #TextOnly
    )
};

annotate service.Events with @(
    UI.HeaderInfo: {
        TypeName: 'Event',
        TypeNamePlural: 'Events',
        Title: { Value: title },
        Description: { Value: status }
    },
    UI.FieldGroup #General: {
        Data: [
            { Value: title },
            { Value: description },
            { Value: status },
        ]
    },
    UI.FieldGroup #Dates: {
        Data: [
            { Value: startDate },
            { Value: endDate }
        ]
    },
    UI.FieldGroup #Capacity: {
        Data: [
            { Value: maxCapacity },
            { Value: attendeeCount },
            { Value: seatsRemaining }
        ]
    },
    UI.FieldGroup #Venue: {
        Data: [
            { Value: venue_ID }
        ]
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'General',
            Label: 'General Information',
            Target: '@UI.FieldGroup#General'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'Dates',
            Label: 'Dates',
            Target: '@UI.FieldGroup#Dates'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'Capacity',
            Label: 'Capacity',
            Target: '@UI.FieldGroup#Capacity'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'Venue',
            Label: 'Venue',
            Target: '@UI.FieldGroup#Venue'
        }
    ]
);



