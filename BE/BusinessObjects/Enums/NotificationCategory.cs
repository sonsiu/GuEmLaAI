namespace GuEmLaAI.BusinessObjects.Enums
{
    public enum NotificationCategory
    {
        Info,
        Warning,
        Error,
        Success,
        WELLCOME,

        ITEM_CREATED, //Data : name
        OUTFIT_CREATED, //Data : name
        REFERRER_COMPLETED, //Data : referrerName
        REFERREE_COMPLETED, //Data : referreeName
        CALENDAR_REMINDER, //Data : garment, outfit ,event
        GLOBAL_NOTFICATION //Data : message (EN,VN)
    }
}
