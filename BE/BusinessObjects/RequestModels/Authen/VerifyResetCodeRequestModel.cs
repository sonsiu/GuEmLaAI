using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessObjects.RequestModels.Authen
{
    public class VerifyResetCodeRequestModel
    {
        public string Email { get; set; }
        public string Code { get; set; }
    }

}
