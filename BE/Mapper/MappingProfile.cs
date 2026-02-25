namespace Services.Mapper
{
    using AutoMapper;
    using BusinessObjects.RequestModels.Authen;
    using BusinessObjects.ResponseModels.Authen;
    using GuEmLaAI.BusinessObjects.Models;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    /// <summary>
    /// Defines the <see cref="MappingProfile" />
    /// </summary>
    public class MappingProfile : Profile
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="MappingProfile"/> class.
        /// </summary>
        public MappingProfile()
        {
            // Map RegisterRequestModel → User
            CreateMap<RegisterRequestModel, User>()
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.Username))
                .ForMember(dest => dest.Password, opt => opt.MapFrom(src => src.Password)) // sẽ hash ở service
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email));

            // Map User to LoginResponseModel
            CreateMap<User, LoginResponseModel>()
                .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => src.DisplayName))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role ?? 0))
                .ForMember(dest => dest.AccessToken, opt => opt.Ignore()) // set in service
                .ForMember(dest => dest.RefreshToken, opt => opt.Ignore()); // set in service
        }
    }
}
