using System;

namespace TravelAgency.TravelTourConfigurationConstants
{
    public static class UsrTravelTourConstants
    {
        /// <summary>
        /// Справочник "Периодичность"
        /// </summary>
        public static class Periodicity
        {
            /// <summary>
            /// Каждый день
            /// </summary>
            public static readonly Guid Everyday = new Guid("C39460C9-E036-4BFE-AF8E-CBA26CD4D8F3");
            /// <summary>
            /// Каждую неделю
            /// </summary>
            public static readonly Guid Everyweek = new Guid("D3129BB6-8AEB-4AF4-AE6E-21CE29FE3EF4");
            /// <summary>
            /// Каждый месяц
            /// </summary>
            public static readonly Guid EveryMonth = new Guid("13E6EDF1-7796-47A8-B9C4-DD15366B987D");

        }

        /// <summary>
        /// Справочник "Состояние тура"
        /// </summary>
        public static class TravelTourState
        {
            /// <summary>
            ///  Запланирован
            /// </summary>
            public static readonly Guid Planned = new Guid("27F81C75-C9A9-45D4-8ACC-379B2AF9B1CC");
            /// <summary>
            /// В работе
            /// </summary>
            public static readonly Guid InWork = new Guid("B8014B2F-233B-4A70-96AF-C43CEBEE98F1");
            /// <summary>
            /// Завершен
            /// </summary>
            public static readonly Guid Finished = new Guid("518AE7A6-ABCC-4665-9CDD-51BBD308A5D6");
        }
    }
}