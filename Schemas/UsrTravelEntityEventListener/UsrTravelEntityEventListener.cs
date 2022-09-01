using Newtonsoft.Json;
using System;
using Terrasoft.Common;
using Terrasoft.Configuration;
using Terrasoft.Core;
using Terrasoft.Core.DB;
using Terrasoft.Core.Entities;
using Terrasoft.Core.Entities.Events;

namespace SdkTestPackage.UsrEducationListener
{
    [EntityEventListener(SchemaName = "UsrTravelAgency1Page")]
    public class UsrEducationEntityEventListener : BaseEntityEventListener
    {
        public const int MaxSkillsCheckCount = 3;

        public const string SendMessageSender = "EducationSaved";

        private UserConnection _userConnection;

        private Guid _usrEducationId;

        /* Переопределение обработчика события сохранения сущности. */
        public override void OnSaved(object sender, EntityAfterEventArgs e)
        {
            base.OnSaved(sender, e);

            var education = (Entity)sender;
            _userConnection = education.UserConnection;
            _usrEducationId = education.PrimaryColumnValue;
            string message = String.Empty;

            var count = GetCountOfUsrEducationSkills();

            if (count < MaxSkillsCheckCount)
            {
                AddNewEducationSkill();
                message = JsonConvert.SerializeObject(new { Operation = "Add" });
            }
            else
            {
                if (count == MaxSkillsCheckCount)
                {
                    int eduCount = GetEducationCountBySkills();
                    var msg = new { Operation = "Add", TotalCount = eduCount };
                    message = JsonConvert.SerializeObject(msg);
                }
                else
                {
                    DeleteSkillsExceptLast();
                    message = JsonConvert.SerializeObject(new { Operation = "Delete" });
                }
            }

            MsgChannelUtilities.PostMessage(_userConnection, SendMessageSender, message);
        }

        private int GetCountOfUsrEducationSkills()
        {
            var esq = new EntitySchemaQuery(_userConnection.EntitySchemaManager, "UsrEducationSkills");
            var countColumn = esq.AddColumn(esq.CreateAggregationFunction(AggregationTypeStrict.Count, "UsrEducationId"));
            esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "UsrEducationId", _usrEducationId));
            var skills = esq.GetEntityCollection(_userConnection);
            int count = skills[0].GetTypedColumnValue<int>(countColumn.Name);

            return count;
        }

        private bool AddNewEducationSkill()
        {
            var entity = _userConnection.EntitySchemaManager.GetInstanceByName("UsrEducationSkills");
            var assignersEntity = entity.CreateEntity(_userConnection);

            assignersEntity.SetColumnValue("Id", Guid.NewGuid());
            assignersEntity.SetColumnValue("UsrEducationId", _usrEducationId);
            assignersEntity.SetColumnValue("UsrEducationSkill", "Skill2");
            assignersEntity.SetColumnValue("UsrSkillDescription", "Skill2Description");

            return assignersEntity.Save();
        }

        private Guid GetLastSkill()
        {
            Guid guid = (new Select(_userConnection)
                .Top(1).Column("Id")
                    .From("UsrEducationSkills")
                .Where("UsrEducationId")
                    .IsEqual(Column.Parameter(_usrEducationId))
                    .OrderByAsc("CreatedOn") as Select)
                .ExecuteScalar<Guid>();

            return guid;
        }

        private bool DeleteSkillsExceptLast()
        {
            Guid lastGuid = GetLastSkill();

            var delete = new Delete(_userConnection)
               .From("UsrEducationSkills")
               .Where("UsrEducationId").IsEqual(Column.Parameter(_usrEducationId))
               .And("Id")
               .IsNotEqual(Column.Parameter(lastGuid));

            return delete.Execute() > 0;
        }

        private int GetEducationCountBySkills()
        {
            Select selectCount = new Select(_userConnection)
                .Column(Func.Count("UsrEducationId"))
                    .From(
                        new Select(_userConnection)
                        .Column("UsrEducationId")
                            .From("UsrEducationSkills")
                        .GroupBy("UsrEducationId")
                            .Having(Func.Count("UsrEducationId"))
                            .IsEqual(Column.Const(MaxSkillsCheckCount))
                          ).As("t");

            int totalCount = selectCount.ExecuteScalar<int>();

            return totalCount;
        }
    }
}