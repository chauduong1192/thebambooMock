import * as React from "react";
import styled from "styled-components";

import { ILog } from "../../interface/mock";
import Tab from "../components/tabs";
import { Button, Icon } from "../components/table";

interface IProps {
  log: ILog;
  onClose: () => void;
}

const Wrapper = styled("div")`
  position: fixed;
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  bottom: 0;
  top: 0;
  right: 0;
  max-width: 60%;
  width: 800px;
  background: white;
  display: flex;
  flex-direction: column;
`;

const Header = styled("div")`
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const StyledTab = styled(Tab)`
  border-bottom: none;
`;

const Content = styled("div")<{ center?: boolean }>`
  padding: 8px;
  overflow: auto;
  flex-grow: 2;
  ${({ center }) =>
    center &&
    `
    display: flex;
    justify-content: center;
    align-items: center;
  `}
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.black};
`;

const ButtonClose = styled(Button)`
  border-radius: 0;
  height: 100%;
`;

const JSONWrapper = styled.pre`
  font-size: 12px;
`;

const getResponse = (response) => {
  let result = "";
  try {
    result = JSON.stringify(JSON.parse(response), undefined, 2);
  } catch {
    result = response;
  }
  return result;
};

const getResponseContent = (log: IProps["log"]) => {
  if (!log.response) {
    return (
      <Content center>
        <Label>Request pending</Label>
      </Content>
    );
  }

  const response = getResponse(log.response?.response || "");
  if (!response) {
    return (
      <Content center>
        <Label>Nothing to preview</Label>
      </Content>
    );
  } else {
    return (
      <Content>
        <JSONWrapper>{response}</JSONWrapper>
      </Content>
    );
  }
};

const getRequestBodyContent = (log: IProps["log"]) => {
  const requestBody = getResponse(log.request?.body || "");
  if (!log.request?.body || !requestBody) {
    return (
      <Content center>
        <Label>Nothing to preview</Label>
      </Content>
    );
  }

  return (
    <Content>
      <JSONWrapper>{requestBody}</JSONWrapper>
    </Content>
  );
};

const getQueryParamsContent = (log: IProps["log"]) => {
  const queryParams = getResponse(log.request?.queryParams || "");
  if (!log.request?.queryParams || !queryParams) {
    return (
      <Content center>
        <Label>Nothing to preview</Label>
      </Content>
    );
  }

  return (
    <Content>
      <JSONWrapper>{queryParams}</JSONWrapper>
    </Content>
  );
};

const Detail = ({ log, onClose }: IProps) => {
  const [tab, setTab] = React.useState(0);

  return (
    <Wrapper>
      <Header>
        <ButtonClose transparent onClick={onClose}>
          <Icon>close</Icon>
        </ButtonClose>
        <StyledTab
          onChange={(selected) => {
            setTab(selected);
          }}
          selected={tab}
          tabs={["Response", "Request Body", "Query Params"]}
        />
      </Header>
      {tab === 0 && getResponseContent(log)}
      {tab === 1 && getRequestBodyContent(log)}
      {tab === 2 && getQueryParamsContent(log)}
    </Wrapper>
  );
};

export default Detail;
