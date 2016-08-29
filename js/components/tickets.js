app.component('tickets', {
	templateUrl: "/views/panels/tickets-table.html",
	controller: function ($scope, $rootScope, Search, client) {
		angular.extend($scope, Search);

		var columns = ["CreationDate", "LastUpdateDate", "Story.ID", "Story.Name", "Project.Name", "L3KanbanStage", "SalesforcePriority", "Author", "TotalPosts", "DaysInPreviousRevision"];

		var flattenObject = function(ob) {
			var toReturn = {};

			for (var i in ob) {
			if (!ob.hasOwnProperty(i)) continue;

			if ((typeof ob[i]) == 'object') {
			var flatObject = flattenObject(ob[i]);
			for (var x in flatObject) {
			if (!flatObject.hasOwnProperty(x)) continue;

			toReturn[i + '.' + x] = flatObject[x];
			}
			} else {
			toReturn[i] = ob[i];
			}
			}
			return toReturn;
		};

		function convertToCSV (hitsToCSV) {
			hitsToCSV = hitsToCSV.map(function (hit) {
				return flattenObject(hit._source);
			});

			var csvContents = columns.join(',');

			for (var i= 0; i < hitsToCSV.length; i++) {
				var rowValues = [];
				for (var j= 0; j < columns.length; j++) {
					var val = hitsToCSV[i][ columns[j] ];
					if (typeof val == "string") val = '"' + val + '"';

					rowValues.push(val);
				}

				csvContents += "\r\n" + rowValues.join(',');
			}

			return encodeURIComponent(csvContents);
        }

		function downloadCSV (filename, contents) {
			var a = document.createElement('a');
			a.href = 'data:attachment/csv,' + contents;
			a.target = '_blank';
			a.download = filename;

			document.body.appendChild(a);
			a.click();
		}

		function findTickets () {
			console.log("tickets table: ", Search.getFilterQuery());

			client.search({
				index: index,
				body: {
					query: {
						bool: {
							filter: Search.getFilterQuery()
						}
					}
				},
				size: 1000
			}).then(function (resp) {

				downloadCSV("test.csv", convertToCSV(resp.hits.hits));

				$scope.hits = resp.hits.hits.map(function (hit) {
					hit._source.CreationDate = moment(hit._source.CreationDate).format("YYYY-MM-DD HH:ss");

					return hit;
				});
			}).catch(function (err) {
				console.log(err);
			});
		}

		$scope.filters = Search.getFilters();
		findTickets();

		$scope.hasFilters = function () {
			return Object.keys($scope.filters).length > 0;
		};

		$scope.$on('$routeUpdate', function () {
			$scope.filters = Search.getFilters();
			findTickets();
		});
	}
});