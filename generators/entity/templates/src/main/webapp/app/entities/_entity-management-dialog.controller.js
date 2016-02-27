(function() {
    'use strict';

    angular
        .module('<%=angularAppName%>')
        .controller('<%= entityAngularJSName %>DialogController', <%= entityAngularJSName %>DialogController);

    <%= entityAngularJSName %>DialogController.$inject = ['$scope', '$stateParams', '$uibModalInstance'<% if (fieldsContainOwnerOneToOne) { %>, '$q'<% } %><% if (fieldsContainBlob) { %>, 'DataUtils'<% } %>, 'entity', '<%= entityClass %>'<% for (idx in differentTypes) { if (differentTypes[idx] != entityClass) {%>, '<%= differentTypes[idx] %>'<% } } %>];

    function <%= entityAngularJSName %>DialogController ($scope, $stateParams, $uibModalInstance<% if (fieldsContainOwnerOneToOne) { %>, $q<% } %><% if (fieldsContainBlob) { %>, DataUtils<% } %>, entity, <%= entityClass %><% for (idx in differentTypes) { if (differentTypes[idx] != entityClass) {%>, <%= differentTypes[idx] %><% } } %>) {
        var vm = this;
        vm.<%= entityInstance %> = entity;<%
            var queries = [];
            for (idx in relationships) {
                var query;
                if (relationships[idx].relationshipType == 'one-to-one' && relationships[idx].ownerSide == true && relationships[idx].otherEntityName != 'user') {
                    query = 'vm.' + relationships[idx].relationshipFieldName.toLowerCase() + 's = ' + relationships[idx].otherEntityNameCapitalized + ".query({filter: '" + relationships[idx].otherEntityRelationshipName.toLowerCase() + "-is-null'});"
                + "\n        $q.all([vm." + entityInstance + ".$promise, vm." + relationships[idx].relationshipFieldName.toLowerCase() + "s.$promise]).then(function() {";
                    if (dto == "no"){
                        query += "\n            if (!vm." + entityInstance + "." + relationships[idx].relationshipFieldName + " || !vm." + entityInstance + "." + relationships[idx].relationshipFieldName + ".id) {"
                    } else {
                        query += "\n            if (!vm." + entityInstance + "." + relationships[idx].relationshipFieldName + "Id) {"
                    }
                    query += "\n                return $q.reject();"
                + "\n            }"
                + "\n            return " + relationships[idx].otherEntityNameCapitalized + ".get({id : vm." + entityInstance + "." + relationships[idx].relationshipFieldName + (dto == 'no' ? ".id" : "Id") + "}).$promise;"
                + "\n        }).then(function(" + relationships[idx].relationshipFieldName + ") {"
                + "\n            vm." + relationships[idx].relationshipFieldName.toLowerCase() + "s.push(" + relationships[idx].relationshipFieldName + ");"
                + "\n        });";
                } else {
                    query = 'vm.' + relationships[idx].otherEntityNameCapitalized.toLowerCase() + 's = ' + relationships[idx].otherEntityNameCapitalized + '.query();';
                }
                if (!contains(queries, query)) {
                    queries.push(query);
                }
            } %><% for (idx in queries) { %>
        <%- queries[idx] %><% } %>
        vm.load = function(id) {
            <%= entityClass %>.get({id : id}, function(result) {
                vm.<%= entityInstance %> = result;
            });
        };

        var onSaveSuccess = function (result) {
            $scope.$emit('<%=angularAppName%>:<%= entityInstance %>Update', result);
            $uibModalInstance.close(result);
            vm.isSaving = false;
        };

        var onSaveError = function (result) {
            vm.isSaving = false;
        };

        vm.save = function () {
            vm.isSaving = true;
            if (vm.<%= entityInstance %>.id != null) {
                <%= entityClass %>.update(vm.<%= entityInstance %>, onSaveSuccess, onSaveError);
            } else {
                <%= entityClass %>.save(vm.<%= entityInstance %>, onSaveSuccess, onSaveError);
            }
        };

        vm.clear = function() {
            $uibModalInstance.dismiss('cancel');
        };
        <%_ if (fieldsContainBlob) { _%>

        vm.openFile = DataUtils.openFile;

        vm.byteSize = DataUtils.byteSize;
        <%_ } _%>
        <%_ for (idx in fields) {
            if (fields[idx].fieldType === 'byte[]' && fields[idx].fieldTypeBlobContent != 'text') { _%>

        vm.set<%= fields[idx].fieldNameCapitalized %> = function ($file, <%= entityInstance %>) {
            <%_ if (fields[idx].fieldTypeBlobContent == 'image') { _%>
            if ($file && $file.$error == 'pattern') {
                return;
            }
            <%_ } _%>
            if ($file) {
                var fileReader = new FileReader();
                fileReader.readAsDataURL($file);
                fileReader.onload = function (e) {
                    var base64Data = e.target.result.substr(e.target.result.indexOf('base64,') + 'base64,'.length);
                    $scope.$apply(function() {
                        <%= entityInstance %>.<%= fields[idx].fieldName %> = base64Data;
                        <%= entityInstance %>.<%= fields[idx].fieldName %>ContentType = $file.type;
                    });
                };
            }
        };
        <%_ } else if (fields[idx].fieldType === 'LocalDate' || fields[idx].fieldType === 'ZonedDateTime') { _%>
        vm.datePickerFor<%= fields[idx].fieldNameCapitalized %> = {};

        vm.datePickerFor<%= fields[idx].fieldNameCapitalized %>.status = {
            opened: false
        };

        vm.datePickerFor<%= fields[idx].fieldNameCapitalized %>Open = function($event) {
            vm.datePickerFor<%= fields[idx].fieldNameCapitalized %>.status.opened = true;
        };
        <%_ } } _%>
    }
})();