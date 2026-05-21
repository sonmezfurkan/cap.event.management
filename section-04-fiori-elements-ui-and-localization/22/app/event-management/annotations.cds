using AdminService as service from '../../srv/admin-service';

annotate service.Events with @(
    UI.SelectionFields: [
        status,
        startDate,
        venue_ID
    ],
    UI.LineItem: [
        { Value: title },
        { Value: status, Criticality: statusCriticality },
        { Value: startDate },
        { Value: endDate },
        { Value: venue_ID },
        { Value: maxCapacity },
        { Value: attendeeCount },
        { Value: seatsRemaining },
    ]
);

annotate service.Events with {
    title @Common.Label : 'Title';
    status @(
        Common.Label : 'Status',
        Common.ValueListWithFixedValues,
        Common.ValueList: {
            CollectionPath: 'EventStatuses',
            Parameters: [
                {
                    $Type: 'Common.ValueListParameterInOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: status
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name'
                }
            ]
        }
    );
    description @Common.Label : 'Description';
    startDate @Common.Label : 'Start Date';
    endDate @Common.Label : 'End Date';
    maxCapacity @Common.Label : 'Maximum Capacity';
    attendeeCount @Common.Label : 'Attendee Count';
    seatsRemaining @Common.Label : 'Seats Remaining';
    venue @(
        Common.Label: 'Venue',
        Common.Text: venue.name,
        Common.TextArrangement: #TextOnly,
        Common.ValueList: {
            CollectionPath: 'Venues',
            Parameters: [
                {
                    $Type: 'Common.ValueListParameterInOut',
                    ValueListProperty: 'ID',
                    LocalDataProperty: venue_ID
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'name'
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'city'
                }
            ]
        }
    )
};

annotate service.Events with @(
    UI.HeaderInfo: {
        TypeName: 'Event',
        TypeNamePlural: 'Events',
        Title: { Value: title }
    },
    UI.Identification: [
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'AdminService.publish',
            Label: 'Publish',
            ![@UI.Hidden]: { $edmJson: { $Not: { $Path: 'IsActiveEntity' } } }
        },
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'AdminService.cancelEvent',
            Label: 'Cancel Event',
            ![@UI.Hidden]: { $edmJson: { $Not: { $Path: 'IsActiveEntity' } } }
        }
    ],
    UI.DataPoint #Capacity : {
        Value: attendeeCount,
        TargetValue: maxCapacity,
        Visualization: #Progress,
        Title: 'Registrations'
    },
    UI.DataPoint #Status: {
        Value: status,
        Criticality: statusCriticality,
        Title: 'Status'
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
    UI.HeaderFacets: [
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'CapacityIndicator',
            Target: '@UI.DataPoint#Capacity'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'Status',
            Target: '@UI.DataPoint#Status'
        }
    ],
    UI.Facets: [
        {
            $Type: 'UI.CollectionFacet',
            ID: 'EventDetails',
            Label: 'Event Details',
            Facets: [
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
                },
            ]
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'Sessions',
            Label: 'Sessions',
            Target: 'sessions/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'Registrations',
            Label: 'Registrations',
            Target: 'registrations/@UI.LineItem'
        }
    ]
);

annotate service.Events actions {
    publish @(
        Common.SideEffects: {
            TargetProperties: ['status', 'statusCriticality']
        }
    );
    cancelEvent @(
        Common.SideEffects: {
            TargetProperties: ['status', 'statusCriticality']
        }
    )
};


annotate service.Venues with {
    ID @(
        Common.Text: name,
        Common.TextArrangement: #TextOnly
    )
};

annotate service.EventStatuses with {
    code @(
        Common.Text: name,
        Common.TextArrangement: #TextOnly
    )
};

annotate service.Sessions with @(
    UI.LineItem: [
        { Value: title },
        { Value: startTime },
        { Value: endTime },
    ]
);

annotate service.Registrations with @(
    readonly,
    UI.LineItem: [
        { Value: firstName },
        { Value: lastName },
        { Value: email },
        { Value: status },
        { Value: confirmationCode },
    ]
);

annotate service.Sessions with {
    title @Common.Label: 'Title';
    startTime @Common.Label: 'Start Time';
    endTime @Common.Label: 'End Time';
};

annotate service.Registrations with {
    firstName @Common.Label: 'First Name';
    lastName @Common.Label: 'Last Name';
    email @Common.Label: 'Email';
    status @Common.Label: 'Status';
    confirmationCode @Common.Label: 'Confirmation Code';
};













