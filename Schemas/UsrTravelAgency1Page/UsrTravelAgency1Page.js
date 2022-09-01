define("UsrTravelAgency1Page", ["ProcessModuleUtilities", "ServiceHelper", "UsrTravelConfigurationConstants"],
	function (ProcessModuleUtilities, ServiceHelper, UsrTravelConfigurationConstants) {
		return {
			entitySchemaName: "UsrTravelAgency",
			attributes: {
				/*************************************************************
								Кол-во текущих активных туров
				*************************************************************/
				"ActiveTravelTour": {
					"dataValueType": this.Terrasoft.DataValueType.INTEGER,
					"type": this.Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
				},
				/*************************************************************
										   Лимит туров
				*************************************************************/
				"LimitTravelTour": {
					"dataValueType": this.Terrasoft.DataValueType.INTEGER,
					"type": this.Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
				},
			},
			modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
			details: /**SCHEMA_DETAILS*/{
				"Files": {
					"schemaName": "FileDetailV2",
					"entitySchemaName": "UsrTravelAgencyFile",
					"filter": {
						"masterColumn": "Id",
						"detailColumn": "UsrTravelAgency"
					}
				},
				"UsrSchema1182aed7Detail6703a761": {
					"schemaName": "UsrSchemaDetail",
					"entitySchemaName": "UsrTours",
					"filter": {
						"detailColumn": "UsrTravelAgency",
						"masterColumn": "Id"
					}
				}
			}/**SCHEMA_DETAILS*/,
			businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
			methods: {

				setValidationConfig: function () {
					this.callParent(arguments);
					this.addColumnValidator("UsrPeriodicity", this.PeriodicityValidator);
				},

				PeriodicityValidator: function () {
					let invalidMessage = "";

					if (this.$UsrPeriodicity &&
						this.areEqual(this.$UsrPeriodicity.value, UsrTravelConfigurationConstants.Periodicity.Everyday)) {
						if (this.$ActiveTravelTour >= this.$LimitTravelTour) {
							const warningPattern = this.get("Resources.Strings.LimitTravelTourWarningText");
							invalidMessage = Ext.String.format(warningPattern, this.$LimitTravelTour);
						}
					}

					return {
						invalidMessage: invalidMessage
					};
				},

				areEqual: function (str1, str2) {
					if (str1 && str2) {
						return str1.toUpperCase() === str2.toUpperCase();
					}
					return false;
				},


				onEntityInitialized: function () {
					this.callParent(arguments);
					this.GetActiveTravelTour();
					this.GetLimitTravelTour();
				},

				GetLimitTravelTour: function () {
					this.Terrasoft.SysSettings.querySysSettingsItem("SysEverydayTravelToursMaxCount", function (value) {
						this.set("LimitTravelTour", value);
					}, this);
				},

				GetActiveTravelTour: function () {
					const esqRadioAd = this.Ext.create("Terrasoft.EntitySchemaQuery", {
						rootSchemaName: "UsrTravelAgency"
					});

					esqRadioAd.addAggregationSchemaColumn("Id", Terrasoft.AggregationType.COUNT, "Count");

					const thisId = this.$Id;
					const filterId = this.Terrasoft.createColumnFilterWithParameter(
						this.Terrasoft.ComparisonType.NOT_EQUAL, "Id", thisId);
					const filterFrequency = this.Terrasoft.createColumnFilterWithParameter(
						this.Terrasoft.ComparisonType.EQUAL, "UsrPeriodicity.Id", UsrTravelConfigurationConstants.Periodicity.Everyday);
					const filterIsActive = this.Terrasoft.createColumnFilterWithParameter(
						this.Terrasoft.ComparisonType.EQUAL, "UsrActive", true);

					const groupFilters = this.Ext.create("Terrasoft.FilterGroup");
					groupFilters.logicalOperation = this.Terrasoft.LogicalOperatorType.AND;

					groupFilters.addItem(filterId);
					groupFilters.addItem(filterFrequency);
					groupFilters.addItem(filterIsActive);

					esqRadioAd.filters.add(groupFilters);

					esqRadioAd.getEntityCollection(function (result) {
						if (!result.success) {
							this.showInformationDialog("Request error");
							return;
						}
						else {
							this.set("ActiveTravelTour", result.collection.getByIndex(0).$Count);
						}
					}, this);
				},

				OnSaveButton: function () {
					alert(this.$ActiveTravelTour);
				},

				getActions: function () {
					const actionItems = this.callParent(arguments);
					const separatorItem = this.getButtonMenuItem({
						Type: "Terrasoft.MenuSeparator",
						Caption: ""
					});
					actionItems.addItem(separatorItem);

					const menuItem = this.getButtonMenuItem({
						"Caption": "Go",
						"Tag": "makePost",
						"Enabled": true,
					});
					actionItems.addItem(menuItem);

					return actionItems;
				},

				makePost: function () {
					const tourId = this.$Id;

					let params = { tourId: this.$Id };

					if (tourId) {
						ServiceHelper.callService("UsrTravelTourService", "AddTours",
							function (response, success) {
								if (!success) {
									this.showInformationDialog("Error!");
								}
							},
							params,
							this
						);

						this.updateDetail({ detail: "UsrSchema1182aed7Detail6703a761" });
					}
				},

				makeSchedule: function () {
					const tourId = this.$Id;

					if (tourId) {
						const args = {
							sysProcessName: "UsrMakeScheduleProcess",
							parameters: {
								TourId: tourId,
							}
						};
						ProcessModuleUtilities.executeProcess(args);
					}
				},

				subscriptionFunction: function () {
					Terrasoft.ServerChannel.on(Terrasoft.EventName.ON_MESSAGE, this.onWebSocketListener, this);
				},
				/**
				 * Обработчик событий.
				 * @param {scope} контекст выполнения.
				 * @param {message} сообщение события.
				 */
				onWebSocketListener: function (scope, message) {
					if (message && message.Header.Sender === 'UsrMakeScheduleNotificator') {
						if (message.Body === "UpdateDetail") {
							this.updateDetail({ detail: "UsrTravelDetail" });
						}
					}
					return;
				},
				/**
				 * Отписка от событий.				
				 */
				destroy: function () {
					this.Terrasoft.ServerChannel.un(Terrasoft.EventName.ON_MESSAGE, this.onWebSocketListener, this);
					this.callParent(arguments);
				},


			},
			dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
			diff: /**SCHEMA_DIFF*/[
				{
					"operation": "insert",
					"name": "UsrName42cdcaa0-5e47-4264-8c5f-5afd485d8f88",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 0,
							"layoutName": "ProfileContainer"
						},
						"bindTo": "UsrName"
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 0
				},
				{
					"operation": "insert",
					"name": "UsrActivef1241a0e-10dc-4e44-9cec-f47002029fa6",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 1,
							"layoutName": "ProfileContainer"
						},
						"bindTo": "UsrActive"
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 1
				},
				{
					"operation": "insert",
					"name": "UsrCode43ac49f8-f624-44c9-890c-2efb91335131",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 2,
							"layoutName": "ProfileContainer"
						},
						"bindTo": "UsrCode"
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 2
				},
				{
					"operation": "insert",
					"name": "UsrComment34e7d49b-a8f7-475a-8bd2-f9ac808e54f8",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 3,
							"layoutName": "ProfileContainer"
						},
						"bindTo": "UsrComment"
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 3
				},
				{
					"operation": "insert",
					"name": "UsrPeriodicity358b4159-d3a6-4a05-890a-a55c3c50e7f9",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 5,
							"layoutName": "ProfileContainer"
						},
						"bindTo": "UsrPeriodicity"
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 4
				},
				{
					"operation": "insert",
					"name": "UsrResponsibleTrue91f82896-6d39-46d5-9a1e-354cef8d3cdc",
					"values": {
						"layout": {
							"colSpan": 24,
							"rowSpan": 1,
							"column": 0,
							"row": 4,
							"layoutName": "ProfileContainer"
						},
						"bindTo": "UsrResponsibleTrue"
					},
					"parentName": "ProfileContainer",
					"propertyName": "items",
					"index": 5
				},
				{
					"operation": "insert",
					"name": "NotesAndFilesTab",
					"values": {
						"caption": {
							"bindTo": "Resources.Strings.NotesAndFilesTabCaption"
						},
						"items": [],
						"order": 0
					},
					"parentName": "Tabs",
					"propertyName": "tabs",
					"index": 0
				},
				{
					"operation": "insert",
					"name": "Files",
					"values": {
						"itemType": 2
					},
					"parentName": "NotesAndFilesTab",
					"propertyName": "items",
					"index": 0
				},
				{
					"operation": "insert",
					"name": "NotesControlGroup",
					"values": {
						"itemType": 15,
						"caption": {
							"bindTo": "Resources.Strings.NotesGroupCaption"
						},
						"items": []
					},
					"parentName": "NotesAndFilesTab",
					"propertyName": "items",
					"index": 1
				},
				{
					"operation": "insert",
					"name": "Notes",
					"values": {
						"bindTo": "UsrNotes",
						"dataValueType": 1,
						"contentType": 4,
						"layout": {
							"column": 0,
							"row": 0,
							"colSpan": 24
						},
						"labelConfig": {
							"visible": false
						},
						"controlConfig": {
							"imageLoaded": {
								"bindTo": "insertImagesToNotes"
							},
							"images": {
								"bindTo": "NotesImagesCollection"
							}
						}
					},
					"parentName": "NotesControlGroup",
					"propertyName": "items",
					"index": 0
				},
				{
					"operation": "insert",
					"name": "Tab124bf357TabLabel",
					"values": {
						"caption": {
							"bindTo": "Resources.Strings.Tab124bf357TabLabelTabCaption"
						},
						"items": [],
						"order": 1
					},
					"parentName": "Tabs",
					"propertyName": "tabs",
					"index": 1
				},
				{
					"operation": "insert",
					"name": "UsrSchema1182aed7Detail6703a761",
					"values": {
						"itemType": 2,
						"markerValue": "added-detail"
					},
					"parentName": "Tab124bf357TabLabel",
					"propertyName": "items",
					"index": 0
				},

				/*
				{
					"operation": "merge",
					"parentName": "LeftContainer",
					"propertyName": "items",
					"name": "SaveButton",
					"values": {
						"click": { "bindTo": "OnSaveButton" },

					}
				},
*/
			]/**SCHEMA_DIFF*/
		};
	});
