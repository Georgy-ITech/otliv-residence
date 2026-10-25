/*
  Рамка карты: двойная линия и шкала минут чередующимися отрезками,
  по углам — координаты. Координаты условные, как и берег.
*/
export default function Neatline() {
  return (
    <div className="neatline" aria-hidden="true">
      <span className="neatline__c neatline__c--tl">43°06′ с. ш.</span>
      <span className="neatline__c neatline__c--tr">131°58′ в. д.</span>
      <span className="neatline__c neatline__c--bl">43°03′ с. ш.</span>
      <span className="neatline__c neatline__c--br">132°03′ в. д.</span>
    </div>
  );
}
