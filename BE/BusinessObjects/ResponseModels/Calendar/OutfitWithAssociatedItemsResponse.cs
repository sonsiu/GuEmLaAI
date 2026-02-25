namespace GuEmLaAI.BusinessObjects.ResponseModels.Calendar
{
    public class OutfitWithAssociatedItemsResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ImageFileName { get; set; }
        //public string ImageUrl { get; set; } // Placeholder for presigned URL injection
        public List<AssociatedItemsResponse> AssociatedItems { get; set; } = new List<AssociatedItemsResponse>();
        public List<string> PoseImages { get; set; } = new List<string>();
    }

    public class AssociatedItemsResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ImageFileName { get; set; }
        public string ImageUrl { get; set; } // Placeholder for presigned URL injection
    }
}
