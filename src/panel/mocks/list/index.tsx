import * as React from "react";
import styled from "styled-components";

import {
  Table,
  Cell,
  HeaderCell,
  TableBody,
  TableHead,
  TableBodyWrapper,
  TableHeadWrapper,
  TableRow,
  Icon,
  Button,
} from "../../components/table";
import {
  Text
} from 'rebass'
import { IStore, IMockResponse } from "../../../interface/mock";

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const EmptyWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
`;


const CellWrapper = styled.div``;

const StatusBar = styled.div<{ status: number }>`
  height: 28px;
  border-radius: 2px;
  background: ${({ theme, status }) => theme.colors[status === 200 ? 'blue' : 'alert']};
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${props => props.theme.colors.white} !important;
`;

const getTotalMockCount = (store: IStore) => {
  let total = 0;
  total += store.mocks.length;
  Object.keys(store.collections).forEach((item) => {
    total += store.collections[item].mocks.length;
  });

  return total;
};

interface IProps {
  store: IStore;
  changeRoute: (route: string) => void;
  onAction: (action: "add" | "delete" | "edit", mock: IMockResponse) => void;
  editMock: (mock: IMockResponse) => void;
  toggleMock: (mock: IMockResponse) => void;
}

const List = (props: IProps) => {
  const { store } = props;
  if (getTotalMockCount(store) === 0) {
    return (
      <EmptyWrapper>
        <Text mb="8px">No Mocks Yet.</Text>
        <Button
          transparent
          link
          onClick={() => props.changeRoute("mock.create")}
        >
          Create a Mock
        </Button>
      </EmptyWrapper>
    );
  }

  return (
    <Wrapper>
      <TableHeadWrapper>
        <Table>
          <TableHead>
            <TableRow>
              <HeaderCell width={40}></HeaderCell>
              <HeaderCell width={80}>
                <CellWrapper>Method</CellWrapper>
              </HeaderCell>
              <HeaderCell>
                <CellWrapper>URL</CellWrapper>
              </HeaderCell>
              <HeaderCell width={60}>
                <CellWrapper>Status</CellWrapper>
              </HeaderCell>
              <HeaderCell width={60}>
                <CellWrapper>Delay</CellWrapper>
              </HeaderCell>
              <HeaderCell width={40}></HeaderCell>
              <HeaderCell width={40}></HeaderCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableHeadWrapper>
      <TableBodyWrapper>
        <Table>
          <TableBody>
            {store.mocks.map((mock, index) => (
              <TableRow key={index} onClick={() => props.editMock(mock)}>
                <Cell width={40}>
                  <CellWrapper>
                    <Icon
                      onClick={(event) => {
                        props.toggleMock(mock);
                        event.stopPropagation();
                      }}
                      style={{ transform: "scale(1.8)", cursor: "pointer" }}
                      color={mock.active ? "primary" : "background"}
                    >
                      {mock.active ? "toggle_on" : "toggle_off"}
                    </Icon>
                  </CellWrapper>
                </Cell>
                <Cell width={80}>
                  <CellWrapper>{mock.method}</CellWrapper>
                </Cell>
                <Cell>
                  <CellWrapper className="ellipsis">{mock.url}</CellWrapper>
                </Cell>
                <Cell width={60}>
                  <CellWrapper>
                    <StatusBar status={mock.status}>
                      {mock.status}
                    </StatusBar>
                  </CellWrapper>
                </Cell>
                <Cell width={60}>
                  <CellWrapper>{mock.delay}</CellWrapper>
                </Cell>
                <Cell width={40}>
                  <CellWrapper>
                    <Button
                      transparent
                      onClick={() => props.editMock(mock)}
                    >
                      <Icon color="primary">edit</Icon>
                    </Button>
                  </CellWrapper>
                </Cell>
                <Cell width={40}>
                  <CellWrapper>
                    <Button
                      transparent
                      onClick={(event) => {
                        props.onAction("delete", mock);
                        event.stopPropagation();
                      }}
                    >
                      <Icon color="alert">delete_forever</Icon>
                    </Button>
                  </CellWrapper>
                </Cell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableBodyWrapper>
    </Wrapper>
  );
};

export default List;
