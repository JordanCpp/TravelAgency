namespace TravelAgency.TravelTourService
{
    using System;
    using System.Runtime.InteropServices.ComTypes;
    using System.ServiceModel;
    using System.ServiceModel.Activation;
    using System.ServiceModel.Web;
    using Terrasoft.Core;
    using Terrasoft.Core.DB;
    using Terrasoft.Core.Entities;
    using Terrasoft.Web.Common;
    using TravelAgency.TravelTourConfigurationConstants;

    [ServiceContract]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class UsrTravelTourService : BaseService
    {
        const int MaxTours = 8;

        [OperationContract]
        [WebInvoke(Method = "POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped,
        ResponseFormat = WebMessageFormat.Json)]

        public bool AddTours(Guid tourId)
        {
            Guid periodicity = GetPeriodicityByTourId(tourId);
            DateTime startDate = DateTime.Now;

            for (int i = 0; i < MaxTours; i++)
            {
                AddTour(tourId, startDate);
                GetNextDatePeriod(periodicity, ref startDate);
            }

            return true;
        }

        public bool AddTour(Guid tourId, DateTime startDate)
        {
            var entity = UserConnection.EntitySchemaManager.GetInstanceByName("UsrTours");
            var assignersEntity = entity.CreateEntity(UserConnection);

            assignersEntity.SetColumnValue("Id", Guid.NewGuid());
            assignersEntity.SetColumnValue("UsrTravelAgencyId", tourId);
            assignersEntity.SetColumnValue("UsrCost", 100500);
            assignersEntity.SetColumnValue("UsrStateTourId", UsrTravelTourConstants.TravelTourState.InWork);
            assignersEntity.SetColumnValue("UsrCountTourist", 5);
            assignersEntity.SetColumnValue("UsrDate", startDate);

            return assignersEntity.Save();
        }

        public void GetNextDatePeriod(Guid periodicity, ref DateTime date)
        {

            if (periodicity == UsrTravelTourConstants.Periodicity.Everyday)
            {
                date = date.AddDays(1);
            }
            else if (periodicity == UsrTravelTourConstants.Periodicity.Everyweek)
            {
                date = date.AddDays(1);
            }
            else if (periodicity == UsrTravelTourConstants.Periodicity.EveryMonth)
            {
                date = date.AddMonths(1);
            }
        }

        public Guid GetPeriodicityByTourId(Guid tourId)
        {
            Guid guid = (new Select(UserConnection)
                .Top(1).Column("Id")
                    .From("UsrTravelAgency")
                .Where("UsrPeriodicityId")
                    .IsEqual(Column.Parameter(tourId))
                    .OrderByAsc("CreatedOn") as Select)
                .ExecuteScalar<Guid>();

            return guid;
        }

        public double GetTravelToursTotalProfitByCode(string code)
        {
            if (string.IsNullOrEmpty(code))
            {
                throw new ArgumentException(nameof(code));
            }

            if (CheckIfTravelTourExist(code))
            {
                return GetTotalSumOfTravelToursByCode(code);
            }
            else
            {
                return -1;
            }
        }

        public bool CheckIfTravelTourExist(string code)
        {
            var travelTour = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "UsrTravelAgency");
            travelTour.AddColumn("Id");
            travelTour.Filters.Add(travelTour.CreateFilterWithParameters(FilterComparisonType.Equal, "UsrCode", code));
            var travel = travelTour.GetEntityCollection(UserConnection);

            return travel.Count > 0;
        }

        public double GetTotalSumOfTravelToursByCode(string code)
        {
            var selectSum = new Select(UserConnection)
                  .Column(Func.Sum("t", "UsrPrice"))
                  .From("UsrTours").As("t")
                      .InnerJoin("UsrTravelAgency").As("tt")
                      .On("t", "UsrTravelAgencyId").IsEqual("tt", "Id")
                  .Where("tt", "UsrCode").IsEqual(Column.Parameter(code))
                  .And("t", "UsrActive").IsEqual(Column.Parameter(1))
                   as Select;

            double totalSum = selectSum.ExecuteScalar<double>();

            return totalSum;
        }
    }
}